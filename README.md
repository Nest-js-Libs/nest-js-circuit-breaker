# Circuit Breaker

Este módulo implementa el patrón Circuit Breaker para manejar fallos en llamadas a servicios externos de manera resiliente, utilizando un enfoque basado en filtros de excepciones.

## Descripción

El Circuit Breaker actúa como un interruptor automático que protege tu aplicación contra fallos en cascada cuando los servicios externos fallan. Opera en tres estados:

- **Cerrado (Closed)**: Estado normal, las peticiones pasan normalmente
- **Abierto (Open)**: Estado de fallo, las peticiones son rechazadas inmediatamente
- **Semi-abierto (Half-Open)**: Estado de prueba, permite un número limitado de peticiones

## Implementación

Este módulo utiliza un enfoque basado en filtros de excepciones (@Catch) en lugar de interceptores, lo que proporciona un manejo más eficiente de los errores y una mejor integración con el sistema de manejo de excepciones de NestJS.

### Ventajas del enfoque basado en filtros

- **Manejo más eficiente de errores**: Los filtros de excepciones están diseñados específicamente para manejar errores, lo que resulta en un código más limpio y eficiente.
- **Mejor integración con NestJS**: Se integra perfectamente con el sistema de manejo de excepciones de NestJS.
- **Separación de responsabilidades**: El filtro se encarga exclusivamente de manejar las excepciones del Circuit Breaker, mientras que el servicio mantiene la lógica del estado del circuito.
- **Rendimiento mejorado**: Reduce la sobrecarga de procesamiento al evitar la ejecución de código innecesario cuando el circuito está abierto.

### Cómo funciona

1. El decorador `@UseCircuitBreaker` establece metadatos en el método y utiliza el servicio CircuitBreakerService.
2. Cuando un circuito está abierto, el servicio lanza una excepción `CircuitBreakerOpenError`.
3. El filtro `CircuitBreakerFilter` captura esta excepción específica antes de que llegue al filtro global.
4. Si se ha definido una función de fallback, el filtro la ejecuta y devuelve su resultado.
5. Si no hay fallback o este falla, se devuelve una respuesta de error estándar.

## Uso

### Decorador

Puedes usar el decorador `@UseCircuitBreaker()` en tus controladores o servicios:

```typescript
@UseCircuitBreaker({
  failureThreshold: 5,      // Número de fallos antes de abrir el circuito
  resetTimeout: 60000,      // Tiempo en ms antes de intentar cerrar el circuito
  halfOpenTimeout: 30000,   // Tiempo en ms en estado semi-abierto
  fallback: (args) => {     // Función que se ejecutará cuando el circuito esté abierto
    return {
      id: args.id,
      name: 'Datos de respaldo para ' + args.id,
      status: 'fallback'
    };
  }
})
@Get('/external-service/:id')
async getExternalData() {
  return await this.externalService.getData();
}
```

### Función de Fallback

La función `fallback` es una característica poderosa que permite definir un comportamiento alternativo cuando el circuito está abierto. En lugar de devolver un error al cliente, puedes proporcionar datos de respaldo o una respuesta degradada.

**Características:**

- Se ejecuta automáticamente cuando el circuito está abierto
- Recibe como parámetro un objeto con todos los argumentos de la solicitud (params, query, body)
- Debe devolver un valor compatible con el tipo de retorno del método original
- Permite mantener la disponibilidad del servicio incluso cuando el sistema dependiente está caído

**Ejemplo de uso:**

```typescript
@UseCircuitBreaker({
  failureThreshold: 3,
  fallback: (args) => {
    // args contiene todos los parámetros de la solicitud
    return {
      id: args.id,
      name: 'Datos de respaldo para ' + args.id,
      status: 'fallback'
    };
  }
})
@Get('/users/:id')
async getUserById(id: string) {
  return this.usersService.findById(id);
}
```

### Opciones de Configuración

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------||
| `failureThreshold` | Número de fallos consecutivos antes de abrir el circuito | 5 |
| `resetTimeout` | Tiempo en milisegundos antes de intentar cerrar un circuito abierto | 60000 |
| `halfOpenTimeout` | Tiempo en milisegundos que el circuito permanece en estado semi-abierto | 30000 |

### Diagrama de Estados

```
[Cerrado] ---(fallos > threshold)---> [Abierto]
   ^
   |                                     |
   |                                     |
   |                                     v
   +---(petición exitosa)---- [Semi-abierto]
```

## Ejemplos de Uso

### Ejemplo Básico

```typescript
@Controller('api')
export class ExternalServiceController {
  constructor(private readonly externalService: ExternalService) {}

  @UseCircuitBreaker()
  @Get('/data')
  async getData() {
    return await this.externalService.fetchData();
  }
}
```

### Ejemplo con Configuración Personalizada

```typescript
@CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  halfOpenTimeout: 15000
})
@Get('/sensitive-endpoint')
async getSensitiveData() {
  return await this.externalService.getSensitiveData();
}
```

## Mejores Prácticas

1. Ajusta los timeouts según las características de tu servicio externo
2. Implementa fallbacks para manejar casos cuando el circuito está abierto
3. Monitorea el estado del circuit breaker para detectar problemas
4. Considera usar diferentes configuraciones para diferentes endpoints

## Integración con Módulos

El Circuit Breaker se integra perfectamente con otros módulos de la aplicación:

```typescript
@Module({
  imports: [
    CircuitBreakerModule.register({
      // Configuración global
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenTimeout: 30000
    })
  ]
})
export class AppModule {}
```