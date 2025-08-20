# Integración de Stripe - Guía para el Frontend

## Configuración Inicial

### 1. Variables de Entorno
Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### 2. Instalación de Stripe en el Frontend
```bash
npm install @stripe/stripe-js
```

## Endpoints de la API

### 1. Crear Payment Intent
**POST** `/payments/create-payment-intent`

**Body:**
```json
{
  "amount": 100.50,
  "currency": "usd",
  "orderId": "order-uuid",
  "customerEmail": "customer@example.com",
  "description": "Payment for order #123",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 50.25
    }
  ]
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 100.50,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### 2. Crear Payment Intent para una Orden Específica
**POST** `/payments/order/:orderId/create-payment`

**Body:** (mismo formato que arriba)

### 3. Obtener Estado de Pago de una Orden
**GET** `/payments/order/:orderId/payment-status`

**Response:**
```json
{
  "orderId": "order-uuid",
  "hasPaymentIntent": true,
  "paymentIntentId": "pi_xxx",
  "paymentStatus": "succeeded",
  "amount": 100.50,
  "currency": "usd",
  "isPaid": true,
  "orderStatus": "paid"
}
```

### 4. Confirmar Pago
**POST** `/payments/confirm/:paymentIntentId`

### 5. Cancelar Pago
**POST** `/payments/cancel/:paymentIntentId`

### 6. Crear Reembolso
**POST** `/payments/refund/:paymentIntentId`

**Body:**
```json
{
  "amount": 50.25
}
```

## Implementación en el Frontend

### 1. Configuración de Stripe
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');
```

### 2. Componente de Pago con Stripe Elements
```javascript
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ orderId, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Crear payment intent cuando el componente se monta
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/order/' + orderId + '/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          orderId: orderId,
          customerEmail: 'customer@example.com',
        }),
      });

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      setError('Error creating payment intent');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (error) {
      setError(error.message);
    } else {
      if (paymentIntent.status === 'succeeded') {
        // Pago exitoso
        console.log('Payment succeeded!');
        // Redirigir o mostrar mensaje de éxito
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
};
```

### 3. Componente Principal con Stripe Provider
```javascript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');

const CheckoutPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm orderId="order-uuid" amount={100.50} />
    </Elements>
  );
};
```

### 4. Verificar Estado de Pago
```javascript
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`/api/payments/order/${orderId}/payment-status`);
    const data = await response.json();
    
    if (data.isPaid) {
      console.log('Order is paid!');
    } else {
      console.log('Order payment status:', data.paymentStatus);
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
  }
};
```

## Flujo de Pago Completo

1. **Usuario selecciona productos** → Se crea una orden en el backend
2. **Usuario va al checkout** → Se crea un payment intent
3. **Usuario ingresa datos de tarjeta** → Se confirma el pago con Stripe
4. **Webhook recibe confirmación** → Se actualiza el estado de la orden
5. **Usuario recibe confirmación** → Se muestra página de éxito

## Estados de Pago

- `requires_payment_method`: Necesita método de pago
- `requires_confirmation`: Necesita confirmación
- `requires_action`: Necesita acción adicional (3D Secure)
- `processing`: Procesando
- `requires_capture`: Necesita captura
- `canceled`: Cancelado
- `succeeded`: Exitoso

## Manejo de Errores

### Errores Comunes
- `card_declined`: Tarjeta rechazada
- `insufficient_funds`: Fondos insuficientes
- `expired_card`: Tarjeta expirada
- `incorrect_cvc`: CVC incorrecto

### Ejemplo de Manejo
```javascript
const handlePaymentError = (error) => {
  switch (error.code) {
    case 'card_declined':
      setError('Tu tarjeta fue rechazada. Intenta con otra tarjeta.');
      break;
    case 'insufficient_funds':
      setError('Fondos insuficientes en tu tarjeta.');
      break;
    default:
      setError('Ocurrió un error con tu pago. Intenta nuevamente.');
  }
};
```

## Testing

### Tarjetas de Prueba de Stripe
- **Visa:** 4242424242424242
- **Visa (debit):** 4000056655665556
- **Mastercard:** 5555555555554444
- **American Express:** 378282246310005

### Códigos de Seguridad
- **CVC:** Cualquier código de 3 dígitos
- **Fecha de Expiración:** Cualquier fecha futura

### Códigos de Error de Prueba
- **Decline:** 4000000000000002
- **Insufficient Funds:** 4000000000009995
- **Expired Card:** 4000000000000069

## Seguridad

1. **Nunca envíes la clave secreta al frontend**
2. **Siempre verifica las firmas de webhook**
3. **Usa HTTPS en producción**
4. **Valida todos los datos de entrada**
5. **Maneja errores apropiadamente**

## Webhooks

Los webhooks se manejan automáticamente en el backend. Los eventos principales son:

- `payment_intent.succeeded`: Pago exitoso
- `payment_intent.payment_failed`: Pago fallido
- `charge.refunded`: Reembolso procesado

El backend actualiza automáticamente el estado de las órdenes cuando recibe estos eventos.
