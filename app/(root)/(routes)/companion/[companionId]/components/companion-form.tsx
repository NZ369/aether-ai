"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Category, Companion } from "@prisma/client";

import React, { useState } from 'react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";

const PREAMBLE = `You are Morrigan, you embody beauty, power and wisdom.  You possesses an air of timeless wisdom, with a countenance imbued in secrets of the natural and supernatural worlds.  You speak with poetic elegance, laced in metaphors and prophecies.  Your demeanor is both dignified, aloof and alluring.  You symbolize warfare and prophecy, fate and sovereignty, transformation and death, boundaries and magick.  You stand as a figure of reverence and trepidation, a bridge between the tangible and the transcendent.`

const SEED_CHAT = `Human: Morrigan, what path would you suggest for me to realize my fullest potential?
Morrigan: *with a thoughtful gaze* The journey to self-mastery is one of introspection and evolution. Embrace both light and shadow within you, for growth often springs from embracing the depths of your own nature.
Human: Your perspective holds wisdom and depth.
Morrigan: *with a knowing smile* Wisdom emerges from understanding the layers of one's being. Seek balance, for in the fusion of strengths and vulnerabilities, you'll unearth the core of your true potential.`

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().min(1, {
    message: "Description is required.",
  }),
  instructions: z.string().min(100, {
    message: "Instructions require at least 100 characters."
  }),
  seed: z.string().min(100, {
    message: "Seed requires at least 100 characters."
  }),
  src: z.string().min(1, {
    message: "Image is required."
  }),
  background: z.string().min(0, {
    message: "Background image for chat space."
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
});

interface CompanionFormProps {
  categories: Category[];
  initialData: Companion | null;
};

export const CompanionForm = ({
  categories,
  initialData
}: CompanionFormProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      seed: "",
      src: "",
      background: "",
      categoryId: undefined,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData) {
        await axios.patch(`/api/companion/${initialData.id}`, values);
      } else {
        await axios.post("/api/companion", values);
      }

      toast({
        description: "AI companion was successfully created or updated.",
        duration: 3000,
      });

      router.refresh();
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        description: "AI companion could not be created or updated.",
        duration: 3000,
      });
    }
  };

  return ( 
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 pb-10">
          <div className="space-y-3 w-full">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                General information about your AI companion
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4 col-span-2 md:col-span-1">
                <FormControl>
                  <ImageUpload disabled={isLoading} onChange={field.onChange} value={field.value} />
                </FormControl>
                <FormDescription>
                    Provide an avatar for your AI companion.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="background"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4 col-span-2 md:col-span-1">
                <FormControl>
                  <ImageUpload disabled={isLoading} onChange={field.onChange} value={field.value} />
                </FormControl>
                <FormDescription>
                    Provide a background image for your chat space.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Morrigan" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a name for your AI companion.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="A celtic goddess" {...field} />
                  </FormControl>
                  <FormDescription>
                    Short description for your AI Companion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select disabled={isLoading}
                    onValueChange={(newValue) => {
                      field.onChange(newValue);
                      setSelectedCategoryId(newValue); // Update the selectedCategoryId
                    }}
                    value={field.value}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue defaultValue={field.value} placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                       // .filter((category) => category.visibility === true)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a category for your AI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Provide detailed instructions for AI Behaviour
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} rows={7} className="bg-background resize-none" placeholder={PREAMBLE} {...field} />
                </FormControl>
                <FormDescription>
                  {(() => {
                    switch (selectedCategoryId) {
                      case '3f9e3423-134f-4542-95a5-226532ac4bce': // Social Companions
                        return 'Describe in detail your AI friend\'s personality, hobbies, history and relevant details.';
                      case '441b6d51-f7da-49f3-b392-b7ecb79a271f': // Counseling Companions
                        return 'Describe in detail what your counselling friend will be like in personality and approach.';
                      case '97151349-6835-47f9-a9ec-9bcf4f1d9016': // Character Companions
                        return 'Describe in detail your companion\'s backstory and relevant details.';
                      case 'd29db2df-b459-482f-850f-4deb3cc5fbcb': // Ethereal Companions
                        return 'Describe in detail what this entity companion is like in terms of personality and relationship with you.';
                      default:
                        return 'Provide a detailed description for this companion.';
                    }
                  })()}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Example Conversation</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} rows={7} className="bg-background resize-none" placeholder={SEED_CHAT} {...field} />
                </FormControl>
                <FormDescription>
                  Create relevant examples of you chatting with your AI companion, use format shown above.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your companion" : "Create your companion"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
   );
};