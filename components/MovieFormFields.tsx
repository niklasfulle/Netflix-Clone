"use client";

import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";

import { MultiSelect } from "@/components/ui/multi-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovieSchema } from "@/schemas";

const TYPE_OPTIONS = process.env.NEXT_PUBLIC_TYPE?.split(",") || ["Movie", "Serie"];
const GENRE_OPTIONS = process.env.NEXT_PUBLIC_GENRE?.split(",") || ["Action", "Comedy", "Drama"];

type MovieFormValues = z.infer<typeof MovieSchema>;

interface MovieFormFieldsProps {
  form: UseFormReturn<MovieFormValues>;
  actorOptions: { label: string; value: string }[];
  actorsLoading: boolean;
  disabled: boolean;
  durationReadOnly?: boolean;
  selectPlaceholder?: string;
}

export const MovieFormFields = ({
  form,
  actorOptions,
  actorsLoading,
  disabled,
  durationReadOnly = false,
  selectPlaceholder = "Select...",
}: MovieFormFieldsProps) => (
  <>
    <FormField
      control={form.control}
      name="movieName"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Name</FormLabel>
          <FormControl>
            <Input
              className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
              {...field}
              disabled={disabled}
              placeholder=""
              type="text"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="movieDescripton"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Description</FormLabel>
          <FormControl>
            <Input
              className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
              {...field}
              disabled={disabled}
              placeholder=""
              type="text"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="movieActor"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Actors</FormLabel>
          <FormControl>
            <MultiSelect
              options={actorOptions}
              value={field.value || []}
              onChange={field.onChange}
              disabled={disabled || actorsLoading}
              placeholder={actorsLoading ? "Loading..." : "Select actors"}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <div className="grid grid-cols-3 gap-2">
      <FormField
        control={form.control}
        name="movieType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="text-white bg-zinc-800 h-10 border-gray-500">
                  <SelectValue placeholder={selectPlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-zinc-800 text-white border-gray-500">
                {TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type} className="hover:bg-zinc-700">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="movieGenre"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Genre</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="text-white bg-zinc-800 h-10 border-gray-500">
                  <SelectValue placeholder={selectPlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-zinc-800 text-white border-gray-500">
                {GENRE_OPTIONS.map((genre) => (
                  <SelectItem key={genre} value={genre} className="hover:bg-zinc-700">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="movieDuration"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Duration</FormLabel>
            <FormControl>
              <Input
                className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                {...field}
                disabled={disabled}
                placeholder="xx:xx:xx"
                type="text"
                readOnly={durationReadOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </>
);
