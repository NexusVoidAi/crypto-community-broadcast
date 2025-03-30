
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Lock, User, Building2, Wallet } from 'lucide-react';
import AuthCard from '@/components/auth/AuthCard';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('business');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would call your registration API here
      console.log('Register with:', { name, email, password, accountType });
      
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletRegister = async () => {
    setIsLoading(true);
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would connect to MetaMask or WalletConnect here
      console.log('Connecting wallet...');
      
      toast.success('Wallet connected successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create an account"
      description="Sign up to start publishing your announcements"
      footer={
        <p className="text-center text-sm text-muted-foreground w-full">
          Already have an account?{' '}
          <Link to="/login" className="text-crypto-blue hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Account type</Label>
          <RadioGroup
            value={accountType}
            onValueChange={setAccountType}
            className="flex space-x-2"
          >
            <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-2 flex-1">
              <RadioGroupItem value="business" id="business" />
              <Label
                htmlFor="business"
                className="cursor-pointer flex items-center"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Business
              </Label>
            </div>
            <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-2 flex-1">
              <RadioGroupItem value="community" id="community" />
              <Label
                htmlFor="community"
                className="cursor-pointer flex items-center"
              >
                <User className="mr-2 h-4 w-4" />
                Community
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Your name or company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full bg-crypto-green text-crypto-dark hover:bg-crypto-green/90"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleWalletRegister}
          disabled={isLoading}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </form>
    </AuthCard>
  );
};

export default Register;
