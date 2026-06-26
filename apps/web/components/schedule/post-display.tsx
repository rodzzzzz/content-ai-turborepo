import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Post = {
    id: string;
    date: Date;
    content: string;
    platform: string;
};

type PostDisplayProps = {
    post: Post;
    onDelete: (id: string) => void;
};

export function PostDisplay({ post, onDelete }: PostDisplayProps) {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{post.platform}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{post.content}</p>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" onClick={() => onDelete(post.id)}>
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}
