import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function PaymentModal({ children }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Top Up Tokens</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-center py-4">
                    <p className="text-muted-foreground">
                        To purchase more tokens, please contact the administrator manually.
                    </p>
                    <p className="font-semibold text-lg">
                        WhatsApp: +62 812-3456-7890
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Provide your email address to the admin to receive tokens.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
