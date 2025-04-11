import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';

type BotCommand = {
  id: string;
  command: string;
  description: string;
  response_template: string;
  is_admin_only: boolean;
  created_at: string;
  updated_at: string;
};

const BotCommandsManagement = () => {
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<BotCommand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      command: '',
      description: '',
      response_template: '',
      is_admin_only: false,
    },
  });
  
  useEffect(() => {
    fetchCommands();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('bot_commands_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_commands',
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchCommands(); // Refresh the commands when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchCommands = async () => {
    setIsLoading(true);
    try {
      // Use 'bot_commands' as the table name with the updated client
      const { data, error } = await supabase
        .from('bot_commands')
        .select('*')
        .order('command');
        
      if (error) throw error;
      
      // Explicitly cast the data to BotCommand[] to ensure type safety
      setCommands(data as BotCommand[]);
    } catch (error: any) {
      console.error('Error fetching bot commands:', error);
      toast.error(`Failed to load bot commands: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openAddDialog = () => {
    form.reset({
      command: '',
      description: '',
      response_template: '',
      is_admin_only: false,
    });
    setCurrentCommand(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (command: BotCommand) => {
    form.reset({
      command: command.command,
      description: command.description,
      response_template: command.response_template,
      is_admin_only: command.is_admin_only,
    });
    setCurrentCommand(command);
    setIsDialogOpen(true);
  };
  
  const handleSave = async (formData: any) => {
    setIsSaving(true);
    
    try {
      if (currentCommand) {
        // Update existing command
        const { error } = await supabase
          .from('bot_commands')
          .update({
            command: formData.command,
            description: formData.description,
            response_template: formData.response_template,
            is_admin_only: formData.is_admin_only,
          })
          .eq('id', currentCommand.id);
          
        if (error) throw error;
        toast.success('Bot command updated successfully');
      } else {
        // Add new command
        const { error } = await supabase
          .from('bot_commands')
          .insert({
            command: formData.command,
            description: formData.description,
            response_template: formData.response_template,
            is_admin_only: formData.is_admin_only,
          });
          
        if (error) throw error;
        toast.success('Bot command added successfully');
      }
      
      // Close dialog and refresh list
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving bot command:', error);
      toast.error(`Failed to save command: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    
    try {
      const { error } = await supabase
        .from('bot_commands')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Bot command deleted successfully');
      setCommands(commands.filter(cmd => cmd.id !== id));
    } catch (error: any) {
      console.error('Error deleting bot command:', error);
      toast.error(`Failed to delete command: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };
  
  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bot Commands Management</CardTitle>
          <CardDescription>Configure Telegram bot commands and responses</CardDescription>
        </div>
        <Button 
          onClick={openAddDialog} 
          className="bg-crypto-blue hover:bg-crypto-blue/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Command
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : commands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bot commands configured yet. Add your first command.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Admin Only</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commands.map((command) => (
                  <TableRow key={command.id}>
                    <TableCell className="font-mono">{command.command}</TableCell>
                    <TableCell>{command.description}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {command.response_template}
                    </TableCell>
                    <TableCell>
                      {command.is_admin_only ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(command)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-500/10"
                        disabled={isDeleting === command.id}
                        onClick={() => handleDelete(command.id)}
                      >
                        {isDeleting === command.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] bg-crypto-darkgray border-border/50">
            <DialogHeader>
              <DialogTitle>
                {currentCommand ? 'Edit Bot Command' : 'Add Bot Command'}
              </DialogTitle>
              <DialogDescription>
                {currentCommand 
                  ? 'Update this command response for your Telegram bot.'
                  : 'Add a new command response for your Telegram bot.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Command</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="/command" 
                          className="bg-crypto-dark border-border/50" 
                          required 
                        />
                      </FormControl>
                      <FormDescription>
                        Command should start with / (e.g., /start, /help)
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Brief description of what the command does" 
                          className="bg-crypto-dark border-border/50" 
                          required 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="response_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Template</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Message the bot will send when this command is used" 
                          className="bg-crypto-dark border-border/50 min-h-[100px]" 
                          required 
                        />
                      </FormControl>
                      <FormDescription>
                        You can use HTML formatting for bold, italic, etc.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_admin_only"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Admin Only</FormLabel>
                        <FormDescription>
                          Restrict this command to admin users only
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-crypto-blue hover:bg-crypto-blue/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Save</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BotCommandsManagement;
