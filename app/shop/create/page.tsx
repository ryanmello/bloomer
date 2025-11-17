/**
 * Create Shop Page
 * 
 * Form for creating a new shop
 * - Collects shop name, phone, and email
 * - Client-side validation via HTML5 form attributes
 * - Redirects to storefront after successful creation
 * - Displays error messages if creation fails
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Package, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateShopPage() {
    // Form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    /**
     * Handle form submission
     * Creates a new shop and redirects to storefront on success
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create shop');
            }

            // Get the newly created shop
            const newShop = await res.json();

            // Set it as the active shop
            await fetch('/api/shop/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId: newShop.id }),
            });

            // Success - redirect to storefront
            router.push('/storefront');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-6">
            <Card className="w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <CardHeader>
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-center text-2xl">Create Your Shop</CardTitle>
                        <CardDescription className="text-center">
                            Provide your shop's details to get started.
                        </CardDescription>
                    </CardHeader>

                    {/* Form fields */}
                    <CardContent className="space-y-4">
                        {/* Shop Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Shop Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., My Flower Shop"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(123) 456-7890"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                Public Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contact@my-shop.com"
                                required
                            />
                        </div>
                    </CardContent>

                    {/* Footer with error display and submit button */}
                    <CardFooter className="flex flex-col gap-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Shop'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}