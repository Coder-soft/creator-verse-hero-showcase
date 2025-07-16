import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  { name: 'Web Development', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Mobile Development', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'UI/UX Design', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Graphic Design', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Writing & Translation', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Digital Marketing', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Video & Animation', icon: <Briefcase className="w-8 h-8" /> },
  { name: 'Music & Audio', icon: <Briefcase className="w-8 h-8" /> },
];

type FreelancerProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function Index() {
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, bio, avatar_url')
        .eq('role', 'freelancer')
        .eq('account_status', 'active')
        .limit(4);

      if (error) {
        console.error('Error fetching freelancers:', error);
      } else if (data) {
        setFreelancers(data);
      }
    };

    fetchFreelancers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Find the perfect freelance services for your business
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Get quality work done quickly and affordably. From web design to content writing, find the right
                    freelancer for any job.
                  </p>
                </div>
                <div className="w-full max-w-lg space-y-2">
                  <form className="flex space-x-2">
                    <Input
                      type="search"
                      placeholder="Search for any service..."
                      className="max-w-lg flex-1"
                    />
                    <Button type="submit">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </form>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold">Popular:</span>
                    <Link to="#" className="text-sm hover:underline">Website Design</Link>
                    <Link to="#" className="text-sm hover:underline">WordPress</Link>
                    <Link to="#" className="text-sm hover:underline">Logo Design</Link>
                    <Link to="#" className="text-sm hover:underline">AI Services</Link>
                  </div>
                </div>
              </div>
              <img
                src="/placeholder.svg"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Link to="#" key={index} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  {category.icon}
                  <span className="mt-2 text-center font-semibold">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Trending Freelancers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {freelancers.map((freelancer) => (
                <Card key={freelancer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Avatar>
                        <AvatarImage src={freelancer.avatar_url || '/placeholder-user.jpg'} alt={freelancer.display_name || 'Freelancer'} />
                        <AvatarFallback>{freelancer.display_name ? freelancer.display_name.charAt(0).toUpperCase() : 'F'}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 overflow-hidden">
                        <h3 className="font-bold truncate">{freelancer.display_name}</h3>
                        {freelancer.bio && <p className="text-sm text-gray-500 truncate">{freelancer.bio}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-blue-600 text-white rounded-lg p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg mb-6">Post a job and get proposals from talented freelancers in minutes.</p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" size="lg">Post a Job</Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                  Browse Freelancers
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}