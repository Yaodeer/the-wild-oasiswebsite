'use server';

import { auth, signIn, signOut } from '@/auth';
import supabase from './supabase';
import { revalidatePath } from 'next/cache';
import { getBookings } from './data-service';
import { redirect } from 'next/navigation';

export async function updateProfile(formData) {
  const session = await auth();
  if (!session) throw new Error('You need to be logged in');

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error('Please provide a valid nationID');

  const updateData = { nationalID, nationality, countryFlag };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId);

  if (error) throw new Error('Guest could not be updated');

  revalidatePath('/account/profile');
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error('You need to be logged in');

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  const { error } = await supabase.from('bookings').insert([newBooking]);

  if (error) throw new Error('Booking could not be created');

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect('/thankyou');
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error('You need to be logged in');

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to delete this booking');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be deleted');

  revalidatePath('/account/reservations');
}

export async function updateBooking(formData) {
  const session = await auth();
  if (!session) throw new Error('You need to be logged in');

  const bookingId = Number(formData.get('bookingId'));

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to update this booking');

  const updateData = {
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
  };

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw new Error('Booking could not be updated');

  revalidatePath(`/account/reservations/edit/${bookingId}`);

  redirect('/account/reservations');
}

export async function signInAction() {
  await signIn('github', { callbackUrl: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
