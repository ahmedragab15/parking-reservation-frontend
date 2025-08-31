import { Button } from "@/components/ui/button";

export default function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex flex-col justify-center items-center h-64 text-center space-y-4">
            <p className="text-red-500 font-semibold">{message}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
            </Button>
        </div>
    );
}
