import { Resend } from 'resend';
import { NewUserEmailTemplate } from '@/components/emails/NewUserEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, tempPassword, type } = await request.json();

    let subject, html;

    if (type === 'new_user') {
      subject = 'Bienvenido - Credenciales de acceso';
      html = NewUserEmailTemplate({ tempPassword });
    }

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: subject,
      html: html
    });

    return Response.json(data);
  } catch (error) {
    console.error('Error al enviar email:', error);
    return Response.json({ error });
  }
} 