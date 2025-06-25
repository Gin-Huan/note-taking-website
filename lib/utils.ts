import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertUTCDateToLocalDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date);
    return date;
  }
  return new Date(date.getTime() - date.getTimezoneOffset()*60*1000);   
}
