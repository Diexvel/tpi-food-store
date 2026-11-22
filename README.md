# Food Store - Aplicación Web de Pedidos de Comida

Aplicación web Full-Stack moderna para la gestión y pedidos de comida gourmet, desarrollada según las especificaciones del Trabajo Práctico Integrador (**TPI Programación 4**) y el modelo de dominio en **UML**.

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.12**
- **FastAPI 0.115.6**: Framework REST asíncrono de alto rendimiento con documentación automática OpenAPI/Swagger.
- **SQLModel 0.0.22**: ORM basado en SQLAlchemy 2.0 y Pydantic v2 sobre **SQLite** (compatible con PostgreSQL).
- **Unit of Work & Repository Pattern**: Gestión transaccional desacoplada. Los commits ocurren **estrictamente en `__exit__`** del Unit of Work; ningún Service ni Router llama a `session.commit()`.
- **Autenticación JWT en Cookies HttpOnly**: Seguridad reforzada contra XSS (el token jamás se expone en JavaScript ni se almacena en `localStorage`).
- **Control de Acceso Basado en Roles (RBAC)**: Roles `admin` y `user` protegidos mediante dependencias reutilizables de FastAPI.
- **Passlib + Bcrypt**: Hash seguro de contraseñas.
- **36 Pruebas Unitarias Automatizadas**: Cobertura exhaustiva de modelos, reglas de negocio RN-01 a RN-06, autenticación y restricciones arquitectónicas.

### Frontend
- **React 19 + TypeScript (Strict Mode con 0 tipos `any`)**
- **Vite**: Entorno de desarrollo y empaquetador ultrarrápido.
- **Tailwind CSS v4**: Sistema de diseño moderno y utilitario con tema gastronómico cálido (Amber / Stone).
- **TanStack Query v5**: Manejo de estado del servidor, caché, refetch en segundo plano e invalidación tras mutaciones.
- **TanStack Form**: Formularios reactivos con validaciones en tiempo real para login, registro y checkout.
- **TanStack Table v8**: Tablas paginadas, filtrables y ordenables para el panel de administración.
- **Zustand v5 con Persist**: Estado del cliente desacoplado (`authStore` sin serializar tokens, `cartStore` con control de stock).
- **Axios con `withCredentials: true`**: Envío automático de cookies de sesión e interceptor de error 401 que limpia la sesión ante expiración o desactivación de cuenta.
- **Lucide React**: Iconografía consistente y limpia.

---

## 📐 Modelo de Dominio y Arquitectura

El backend sigue una arquitectura por capas con separación estricta:
```
backend/
├── app/
│   ├── core/           # Configuración, DB, seguridad, UoW y repositorio base
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   ├── unit_of_work.py
│   │   └── base_repository.py
│   ├── modules/        # Módulos del dominio
│   │   ├── usuarios/   # Modelos, schemas, repo, UoW, servicio, router
│   │   ├── auth/       # Login, registro, logout, /auth/me
│   │   ├── categorias/ # CRUD de categorías con baja lógica
│   │   ├── productos/  # CRUD de productos, filtros, stock y baja lógica
│   │   └── pedidos/    # Pedidos, detalles, máquina de estados y resumen
│   ├── db/
│   │   └── seed.py     # Script de inicialización idempotente
│   └── main.py         # Entrypoint FastAPI y configuración de CORS
└── tests/              # 36 pruebas unitarias completas
```

### Entidades del Dominio (UML)
1. **Usuario**: `id`, `username` (único), `full_name`, `email` (único), `hashed_password`, `role` (`admin` | `user`), `disabled`.
2. **Categoria**: `id`, `nombre` (único), `descripcion`, `activo` (baja lógica).
3. **Producto**: `id`, `nombre`, `descripcion`, `precio_base`, `imagen_url`, `stock`, `disponible`, `activo`, `categoria_id`.
4. **Pedido**: `id`, `usuario_id`, `estado` (`PENDIENTE`, `EN_PREPARACION`, `ENTREGADO`, `CANCELADO`), `forma_pago` (`EFECTIVO`, `TRANSFERENCIA`), `direccion_entrega`, `notas`, `total`, `created_at`, `updated_at`.
5. **DetallePedido**: `id`, `pedido_id`, `producto_id`, `nombre_producto` (snapshot inmutable), `precio_unitario` (snapshot inmutable), `cantidad`, `subtotal`.

---

## 📋 Reglas de Negocio Implementadas

- **RN-01 (Creación de Pedido)**: Descuenta stock atómicamente, valida stock suficiente y disponibilidad, impide productos repetidos, calcula totales y nace en estado `PENDIENTE`. Ante cualquier fallo, se ejecuta un rollback atómico completo.
- **RN-02 (Máquina de Estados de Pedidos)**: 
  - `PENDIENTE` ➔ `EN_PREPARACION` ➔ `ENTREGADO`.
  - `CANCELADO` solo alcanzable desde `PENDIENTE` o `EN_PREPARACION`.
  - Estados finales `ENTREGADO` y `CANCELADO` son inmutables.
- **RN-03 (Cancelación y Restitución de Stock)**: Al cancelar un pedido, el stock de cada producto se restituye automáticamente en la misma transacción.
- **RN-04 (Control de Acceso y Propiedad)**:
  - Los clientes solo pueden ver sus propios pedidos y cancelarlos únicamente si su estado es `PENDIENTE`.
  - Los administradores pueden visualizar todos los pedidos y avanzar o cancelar estados.
- **RN-05 (Inmutabilidad de Pedidos)**: Los pedidos y sus líneas no se borran físicamente ni se editan sus productos/precios una vez confirmados.
- **RN-06 (Validación Estricta de Esquemas)**: `forma_pago` restringida a `EFECTIVO` o `TRANSFERENCIA`, `direccion_entrega` entre 5 y 200 caracteres, y mínimo 1 ítem en el pedido.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- **Python 3.11, 3.12 o 3.13** (se recomienda 3.12)
- **Node.js 18+** y **pnpm** (o npm)

---

### 1. Configuración del Backend

1. Ingresar a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Crear y activar un entorno virtual:
   - **En Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **En Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Instalar las dependencias exactas:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar las variables de entorno y Base de Datos (PostgreSQL):
   Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *Contenido de `.env`:*
   ```ini
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodstore_db
   SECRET_KEY=cambiar-esta-clave-de-al-menos-32-caracteres-super-segura-1234
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   > **💡 Tip (Levantar PostgreSQL con Docker en un solo comando):**
   > En la raíz del proyecto se incluye un `docker-compose.yml`:
   > ```bash
   > docker compose up -d
   > ```
   > Esto iniciará un contenedor PostgreSQL 16 listo en el puerto 5432 con la base `foodstore_db`.
   >
   > *(Opcional: Si deseas usar SQLite localmente, simplemente descomenta `DATABASE_URL=sqlite:///./foodstore.db` en el archivo `.env`).*

5. Inicializar la base de datos y cargar los datos iniciales (Seed):
   ```bash
   python -m app.db.seed
   ```
   *Esto creará automáticamente las tablas en PostgreSQL, el usuario administrador y productos con stock en 4 categorías.*

6. Ejecutar la suite de pruebas unitarias:
   ```bash
   python -m unittest discover tests -v
   ```
   *(Debe mostrar los 36 tests en OK).*

7. Iniciar el servidor backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Base: `http://localhost:8000/api/v1`
   - Documentación Interactiva Swagger: `http://localhost:8000/docs`
   - Documentación Redoc: `http://localhost:8000/redoc`

---

### 2. Configuración del Frontend

1. Abrir otra terminal e ingresar a la carpeta `frontend`:
   ```bash
   cd frontend
   ```

2. Instalar dependencias con `pnpm`:
   ```bash
   pnpm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *Contenido de `.env`:*
   ```ini
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. Compilar y verificar tipos TypeScript (estricto, 0 errores):
   ```bash
   pnpm run build
   ```

5. Iniciar el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
   - Aplicación Web disponible en: `http://localhost:5173`

---

## 🔑 Credenciales de Acceso por Defecto

| Rol | Usuario | Contraseña | Acceso |
|---|---|---|---|
| **Administrador** | `admin` | `Admin1234!` | Acceso completo al Panel de Administración (`/admin/*`) y al catálogo de compras |
| **Cliente** | *Registro libre en `/register`* | *Mínimo 8 caracteres* | Navegación, carrito, checkout y `/mis-pedidos` |

---

## 💻 Módulos de la Aplicación Web

### Portal del Cliente
- **Catálogo (`/`)**: Exploración de comidas con búsqueda insensible a mayúsculas/minúsculas, filtrado interactivo por categorías, paginación por servidor, avisos de stock limitado y botón reactivo para añadir al carrito.
- **Carrito de Compras (`/carrito`)**: Vista detallada de productos seleccionados, ajuste de cantidades restringido por el stock disponible en tiempo real, eliminación de ítems y cálculo inmediato de subtotales y total.
- **Checkout (`/checkout`)**: Confirmación de pedido con validación TanStack Form de dirección exacta (5 a 200 caracteres), selección de forma de pago (Efectivo / Transferencia), notas opcionales y resumen lateral de la orden.
- **Mis Pedidos (`/mis-pedidos`)**: Historial del cliente con etiquetas de estado en tiempo real, desglose de ítems adquiridos y botón de cancelación habilitado exclusivamente cuando el pedido está en estado `PENDIENTE`.

### Panel de Administración (`/admin`)
- **Resumen (`/admin/resumen`)**: Tarjetas de métricas clave (pedidos pendientes, en preparación, entregados, cancelados, pedidos del día e ingresos totales de pedidos entregados) y barra de distribución porcentual con tasa de entrega.
- **Gestión de Categorías (`/admin/categorias`)**: Tabla TanStack Table con paginación, modal de alta/edición y confirmación de baja lógica.
- **Gestión de Productos (`/admin/productos`)**: Tabla con miniaturas, selector de categoría, switch rápido de disponibilidad, modal de alta/edición completa y baja lógica.
- **Gestión de Pedidos (`/admin/pedidos`)**: Tabla con filtros rápidos por estado y botones de transición según la máquina de estados RN-02 (*Iniciar Preparación*, *Marcar Entregado*, *Cancelar Pedido* con restitución de stock).
- **Gestión de Usuarios (`/admin/usuarios`)**: Lista de cuentas con estados activo/desactivado, botón para activar o revocar acceso, y protección automática para evitar la auto-desactivación del admin conectado.

---

## 📹 Enlaces de Entrega

- **Repositorio de Código**: https://github.com/Diexvel/tpi-food-store
- **Video Demostrativo**: `https://youtu.be/<video-id>` *(Reemplazar con el enlace a YouTube o Loom del video explicativo)*

---

## 👨‍💻 Autoría y Cátedra
- **Materia**: Programación 4
- **Carrera**: Tecnicatura Universitaria en Programación
- **Año**: 2026
