import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

type Profile = {
  display_name: string;
  avatar_url: string;
  bio: string;
};

type FreelancerProfileCardProps = {
  profile: Profile;
  price?: number | null;
};

export default function FreelancerProfileCard({ profile, price }: FreelancerProfileCardProps) {
  return (
    <Card>
      {price && (
        <>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Standard Package</CardTitle>
              <p className="text-2xl font-bold">${price}</p>
            </div>
            <CardDescription>A simple, straightforward price for this service.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Continue (${price})</Button>
          </CardContent>
          <Separator className="my-4" />
        </>
      )}
      <CardHeader>
        <CardTitle>About The Seller</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{profile.display_name}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{profile.bio || "No bio provided."}</p>
        <Button variant="outline" className="w-full">Contact Me</Button>
      </CardContent>
    </Card>
  );
}