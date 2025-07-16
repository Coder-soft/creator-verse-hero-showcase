import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function PostCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <Skeleton className="h-40 w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center text-sm text-muted-foreground">
          <Skeleton className="h-6 w-6 rounded-full mr-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-2" />
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-8 w-1/3" />
      </CardFooter>
    </Card>
  );
}