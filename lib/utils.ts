import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function difference(arrA: any[], arrB: any[]) {
  //return arrA.filter(x => !arrB.includes(x)).concat(arrB.filter(x => !arrA.includes(x)));
  return arrA.filter(x => !arrB.includes(x));
}

export function swapElements(array: any[], index1: number, index2: number) {
  let temp = array[index1];
  array[index1] = array[index2];
  array[index2] = temp;
  return array
};