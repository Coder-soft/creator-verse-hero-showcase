-- Create table for conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES freelancer_posts(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT conversations_unique_participants UNIQUE (buyer_id, freelancer_id, post_id)
);

-- Create table for messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations

-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = freelancer_id);

-- Users can create conversations they are part of
CREATE POLICY "Users can create conversations they are part of"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = freelancer_id);

-- Users can update conversations they are part of
CREATE POLICY "Users can update conversations they are part of"
    ON conversations FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = freelancer_id);

-- Users can delete conversations they are part of
CREATE POLICY "Users can delete conversations they are part of"
    ON conversations FOR DELETE
    USING (auth.uid() = buyer_id OR auth.uid() = freelancer_id);

-- RLS Policies for messages

-- Users can view messages from conversations they are part of
CREATE POLICY "Users can view messages from their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.freelancer_id)
        )
    );

-- Users can create messages in conversations they are part of
CREATE POLICY "Users can create messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (auth.uid() = conversations.buyer_id OR auth.uid() = conversations.freelancer_id)
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id);

-- Admin policies
CREATE POLICY "Admins can select all conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can select all messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger to update the last_message_at timestamp on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE PROCEDURE update_conversation_timestamp();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql; 