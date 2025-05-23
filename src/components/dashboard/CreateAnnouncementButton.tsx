
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CreateAnnouncementButtonProps = {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

const CreateAnnouncementButton: React.FC<CreateAnnouncementButtonProps> = ({
  className,
  variant = 'secondary',
  size = 'default',
}) => {
  const navigate = useNavigate();

  return (
    <Button
      className={`${className} bg-crypto-green hover:bg-crypto-green/90 text-white`}
      variant={variant}
      size={size}
      onClick={() => navigate('/announcements/create')}
    >
      <Plus className="mr-2 h-4 w-4" />
      Create Announcement
    </Button>
  );
};

export default CreateAnnouncementButton;
