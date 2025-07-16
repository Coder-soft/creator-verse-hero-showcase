import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { PostEditor } from "@/components/freelancer/PostEditor";

export default function FreelancerPostCreate() {
  const navigate = useNavigate();

  const handleSuccess = (postId: string) => {
    // After publishing or saving draft, redirect to posts manager
    navigate("/freelancer/posts");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-6xl">
        <PostEditor onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
