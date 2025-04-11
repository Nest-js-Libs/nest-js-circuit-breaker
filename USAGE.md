# Uso del Patrón Circuit Breaker

## Introducción

El patrón Circuit Breaker es una solución para prevenir fallos en cascada en sistemas distribuidos. Funciona como un interruptor eléctrico: cuando detecta demasiados fallos, "abre el circuito" y rechaza las solicitudes hasta que el sistema subyacente se recupere.

## Cómo usar el decorador `@CircuitBreaker`

Para aplicar el patrón Circuit Breaker a un método o controlador, simplemente usa el decorador `@CircuitBreaker` proporcionando las opciones de configuración:

```typescript
import { CircuitBreaker } from '../circuit-breaker/decorators/circuit-breaker.decorator';

@Controller('/api')
export class MiController {
  
  @CircuitBreaker({
    key: 'mi-servicio-externo', // Identificador único (opcional)
    failureThreshold: 3,        // Número de fallos antes de abrir el circuito
    resetTimeout: 30000,        // Tiempo en ms para intentar cerrar el circuito (30s)
    halfOpenTimeout: 5000,      // Tiempo en ms para el estado semi-abierto (5s)
    fallback: (args) => {       // Función que se ejecuta cuando el circuito está abierto
      return { status: 'fallback', message: 'Servicio temporalmente no disponible' };
    }
  })
  @Get('/datos')
  async obtenerDatos() {
    // Tu lógica aquí
    // Si falla demasiadas veces, el circuit breaker se activará
  }
}
```

## Cómo funciona

1. El decorador `@CircuitBreaker` aplica automáticamente el interceptor `CircuitBreakerInterceptor`
2. El interceptor registra el circuito con el nombre especificado (o genera uno automáticamente)
3. Cuando ocurren demasiados fallos, el circuito se abre y se lanza una excepción `CircuitBreakerOpenError`
4. El filtro `CircuitBreakerFilter` captura esta excepción y devuelve una respuesta HTTP 503 (Service Unavailable)
5. Después del tiempo de espera, el circuito pasa a estado semi-abierto y permite algunas solicitudes para probar si el servicio se ha recuperado

## Opciones de configuración

| Opción | Descripción | Valor predeterminado |
|--------|-------------|----------------------|
| key | Identificador único para el circuito | `{ClassName}_{MethodName}` |
| failureThreshold | Número de fallos antes de abrir el circuito | 5 |
| resetTimeout | Tiempo en ms para intentar cerrar el circuito | 30000 (30s) |
| halfOpenTimeout | Tiempo en ms para el estado semi-abierto | 30000 (30s) |
| fallback | Función que se ejecuta cuando el circuito está abierto | `() => Promise.reject(new Error('Fallback function not provided'))` |

## Solución de problemas

Si el Circuit Breaker no funciona correctamente, verifica:

1. Que el decorador `@CircuitBreaker` esté aplicado correctamente al método o controlador
2. Que el módulo `CircuitBreakerModule` esté importado en tu módulo principal
3. Que las excepciones lanzadas por tu código sean capturadas correctamente por el interceptor