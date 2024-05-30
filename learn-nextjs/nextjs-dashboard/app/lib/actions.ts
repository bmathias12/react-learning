'use server';

import pg from 'pg'
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


require('dotenv').config();

const { Client } = pg

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});
async function connectToDatabase() {
  await client.connect();
}

// Call the function
connectToDatabase();
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert the new invoice into the database
    try {
        await client.query(
          `INSERT INTO invoices (customer_id, amount, status, date)
           VALUES ($1, $2, $3, $4)`,
          [customerId, amountInCents, status, date]
        );
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to enter invoice.');
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;

  try {
    await client.query(
      `UPDATE invoices
         SET customer_id = $1, amount = $2, status = $3
         WHERE id = $4`,
      [customerId, amountInCents, status, id]
    );
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    try {
        await client.query(`DELETE FROM invoices WHERE id = $1`, [id]);
      } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update invoice.');
      }
    revalidatePath('/dashboard/invoices');
}