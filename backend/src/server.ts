import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date()
  });
});

// Pause Subscription API
// Creates daily ledger entries with billable = false
app.post(
  '/api/subscriptions/:id/pause',
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { startDate, endDate } = req.body;

    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id }
      });

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const transactions = [];

      let current = new Date(start);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];

        transactions.push(
          prisma.dailyDeliveryLedger.upsert({
            where: {
              id: `${id}-${dateStr}`
            },

            update: {
              status: 'PAUSED',
              billable: false,
              deliveredQuantity: 0
            },

            create: {
              id: `${id}-${dateStr}`,
              date: new Date(current),
              subscriptionId: id,
              scheduledQuantity: subscription.quantity,
              deliveredQuantity: 0,
              status: 'PAUSED',
              billable: false
            }
          })
        );

        current.setDate(current.getDate() + 1);
      }

      await prisma.$transaction(transactions);

      return res.status(200).json({
        success: true,
        message: 'Subscription paused successfully.'
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// Razorpay Webhook Confirmation
app.post(
  '/api/payments/webhook',
  async (req: Request, res: Response) => {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const signature = String(
      req.headers['x-razorpay-signature'] || ''
    );

    const eventId = String(
      req.headers['x-razorpay-event-id'] || ''
    );

    const shasum = crypto.createHmac(
      'sha256',
      webhookSecret
    );

    shasum.update(JSON.stringify(req.body));

    const expectedSignature = shasum.digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        error: 'Invalid webhook signature'
      });
    }

    if (
      await prisma.paymentEvent.findUnique({
        where: {
          gatewayEventId: eventId
        }
      })
    ) {
      return res.status(200).json({
        status: 'already_processed'
      });
    }

    const event = req.body;

    if (event.event === 'payment.captured') {
      const invoiceId =
        event.payload.payment.entity.notes.invoiceId;

      await prisma.$transaction([
        prisma.paymentEvent.create({
          data: {
            gatewayEventId: eventId,
            eventType: event.event,
            payload: event
          }
        }),

        prisma.invoice.update({
          where: {
            id: invoiceId
          },

          data: {
            paymentStatus: 'SUCCESS'
          }
        })
      ]);
    }

    return res.status(200).json({
      status: 'ok'
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `GGR Backend running on port ${PORT}`
  );
});
