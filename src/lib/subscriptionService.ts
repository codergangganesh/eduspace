
export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    priceId: string;
}

export const PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Essential features for students',
        price: 0,
        interval: 'month',
        features: ['Basic access', 'Limited storage', 'Community support'],
        priceId: '',
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Advanced features for serious learners',
        price: 9.99,
        interval: 'month',
        features: ['Unlimited access', 'Priority support', 'Advanced analytics'],
        priceId: 'price_pro_monthly',
    },
];

export const createCheckoutSession = async (priceId: string) => {
    console.log('Creating checkout session for:', priceId);
    return { url: '#' }; // Mock implementation
};

export const getSubscriptionStatus = async () => {
    return { status: 'active', planId: 'free' }; // Mock implementation
};
