import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function swapElements(array: any[], index1: number, index2: number) {
  const temp = array[index1];
  array[index1] = array[index2];
  array[index2] = temp;
  return array
};