import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { MovieFormFields } from '../MovieFormFields';
import { Form } from '../ui/form';
import type { MovieSchema } from '@/schemas';

let mockGenres: string[] = [];
jest.mock('@/components/providers/GenreProvider', () => ({ useGenreOptions: () => mockGenres }));
beforeEach(() => { mockGenres = []; });

function EmptyConfigurationForm() {
  const form = useForm<z.infer<typeof MovieSchema>>({ defaultValues: { movieName: '', movieDescripton: '', movieType: 'Movie', movieGenre: '', movieDuration: '', movieVideo: '' } });
  return <Form {...form}><form><MovieFormFields form={form} actorOptions={[]} actorsLoading={true} disabled={false} /></form></Form>;
}

it('explains missing genres and keeps actor selection disabled while options are loading', () => {
  render(<EmptyConfigurationForm />);
  expect(screen.getByText('No genres are configured.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Genre' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
});

it('enables genre selection when an administrator has configured the catalog', () => {
  mockGenres = ['Drama', 'Thriller'];
  render(<EmptyConfigurationForm />);
  expect(screen.getByRole('combobox', { name: 'Genre' })).toBeEnabled();
  expect(screen.queryByText('No genres are configured.')).not.toBeInTheDocument();
});
