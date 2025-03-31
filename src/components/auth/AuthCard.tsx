
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const AuthCard: React.FC<AuthCardProps> = ({ title, description, children, footer }) => {
  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-crypto-dark"></div>
        <div className="absolute inset-0 bg-gradient-radial from-crypto-blue/20 via-transparent to-transparent opacity-50"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>
      
      <Card className="w-full max-w-md border border-border/50 glassmorphism bg-crypto-darkgray/50 shadow-xl relative z-10">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 rounded-md bg-crypto-green flex items-center justify-center">
              <span className="text-black font-bold text-lg">AA</span>
            </div>
          </div>
          <CardTitle className="text-xl font-space text-center">{title}</CardTitle>
          {description && <CardDescription className="text-center">{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  );
};

export default AuthCard;
