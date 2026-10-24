import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { MovieFormFields } from '../MovieFormFields';
import { Form } from '../ui/form';
import type { MovieSchema } from '@/schemas';

let mockGenres: string[] = [];
jest.mock('@/components/providers/GenreProvider', () => ({ useGenreOptions: () => mockGenres }));
beforeEach(() => { mockGenres = []; localStorage.clear(); });

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

function CastForm() {
  const form = useForm<z.infer<typeof MovieSchema>>({ defaultValues: { movieActor: [] } });
  const actors = [
    { value: 'a', label: 'Alice Adams' },
    { value: 'b', label: 'Bella Brown' },
    { value: 'c', label: 'Cara Cole' },
    { value: 'd', label: 'Dana Davis' },
  ];
  return <Form {...form}><form><MovieFormFields form={form} actorOptions={actors} actorsLoading={false} disabled={false} />
    <button type="button" onClick={() => form.setValue('movieActor', ['d'])}>Select newly created actor</button>
  </form></Form>;
}

function actorOrder() {
  return screen.getAllByRole('checkbox').map((checkbox) => checkbox.closest('label')!.textContent);
}

it('prioritizes recent actors without duplicates and restores the normal order during a search', () => {
  localStorage.setItem('netflix:recent-actors:v1', JSON.stringify(['c', 'b', 'a']));
  render(<CastForm />);
  fireEvent.click(screen.getByRole('button', { name: 'Select actors' }));
  expect(screen.getByText('Recently used')).toBeInTheDocument();
  expect(actorOrder()).toEqual(['Cara Cole', 'Bella Brown', 'Alice Adams', 'Dana Davis']);
  fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'a' } });
  expect(screen.queryByText('Recently used')).not.toBeInTheDocument();
  expect(actorOrder()).toEqual(['Alice Adams', 'Bella Brown', 'Cara Cole', 'Dana Davis']);
  fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: '' } });
  expect(actorOrder()).toEqual(['Cara Cole', 'Bella Brown', 'Alice Adams', 'Dana Davis']);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Dana Davis' }));
  expect(actorOrder()).toEqual(['Dana Davis', 'Cara Cole', 'Bella Brown', 'Alice Adams']);
  expect(JSON.parse(localStorage.getItem('netflix:recent-actors:v1')!)).toEqual(['d', 'c', 'b']);
});

it('remembers an actor automatically selected after inline creation', () => {
  render(<CastForm />);
  fireEvent.click(screen.getByRole('button', { name: 'Select newly created actor' }));
  expect(JSON.parse(localStorage.getItem('netflix:recent-actors:v1')!)).toEqual(['d']);
});
