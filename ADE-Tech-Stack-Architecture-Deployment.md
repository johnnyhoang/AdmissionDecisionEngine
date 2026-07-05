# Admission Decision Engine (ADE) — Tech Stack, Architecture & Deployment

Tài liệu này tóm tắt toàn bộ cấu trúc kỹ thuật (Tech Stack), kiến trúc cấu hình (Configuration), mô hình dữ liệu (Database Schema) và quy trình triển khai (Deployment) của hệ thống gợi ý nguyện vọng tuyển sinh (Đại học & Lớp 10 THPT).

## 1. Technology Stack (Công nghệ sử dụng)

Hệ thống được thiết kế dưới dạng Monorepo sử dụng npm workspaces.

### Frontend (`apps/frontend/`)

- **Framework**: React 18+ (TypeScript), xây dựng bằng Vite.
- **Styling**: Tailwind CSS (giao diện tối ưu Mobile-first, Dark mode, Glassmorphic UI).
- **Icons**: `lucide-react`.
- **Charts**: `recharts` để vẽ biểu đồ phân tích điểm chuẩn qua các năm.
- **Client Auth**: `@supabase/supabase-js` (tích hợp trực tiếp Google OAuth thông qua Supabase).

### Backend (`apps/backend/`)

- **Framework**: NestJS (Node.js, TypeScript).
- **Database ORM**: TypeORM kết nối PostgreSQL.
- **Authentication**: `passport-jwt` + `jwks-rsa` hỗ trợ giải mã asymmetric keys (ES256) được ký bởi Supabase Auth.
- **AI Integration**: OpenAI (GPT), Anthropic (Claude), Google (Gemini) và Groq Cloud dùng cho việc gợi ý và truy vấn thông tin điểm chuẩn thông minh.
- **API Documentation**: Swagger UI (đăng ký tại `/swagger` trên môi trường local).

## 2. Architecture & Configuration (Kiến trúc & Cấu hình)

### Luồng Authentication (Google OAuth & JWT)

*(Sơ đồ luồng authentication — bổ sung khi có.)*

### Biến môi trường (Environment Variables)

**Frontend** (`apps/frontend/.env` ở local / Vercel Environment Variables ở production):

- `VITE_SUPABASE_URL`: Endpoint dự án Supabase (`https://czngbleeeiljsrpbaksg.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Khóa public anon của Supabase dùng để khởi tạo client auth.
- `VITE_API_BASE_URL`: Endpoint API của backend (`http://localhost:3000/api/v1` ở local, `https://ade-backend.vercel.app/api/v1` ở production).

**Backend** (`apps/backend/.env` ở local / Vercel Environment Variables ở production):

- `DATABASE_URL`: Connection string kết nối cơ sở dữ liệu Supabase PostgreSQL.
- `JWT_SECRET`: Khóa symmetric backup (HS256) dùng để ký các token nội bộ hoặc fallback.
- `SUPABASE_URL`: Endpoint dự án Supabase (`https://czngbleeeiljsrpbaksg.supabase.co`).
- `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`: Khóa API các mô hình AI để xử lý chat và tìm điểm chuẩn tự động.

## 3. Database Schema (Mô hình dữ liệu)

Hệ thống lưu trữ trên PostgreSQL (Supabase), cấu hình TypeORM ở chế độ `synchronize: true` trên môi trường dev/production để tự động đồng bộ cấu trúc bảng.

### A. Phân hệ Phân quyền & User

- `G10HCM_USER`: Lưu thông tin người dùng (id - uuid từ Supabase, email, name, avatar, role `ADMIN` | `USER`).
- `USER_PERMISSION`: Lưu chi tiết phân quyền động theo từng phân hệ (`module`: `GRADE10` hoặc `UNIVERSITY`, `functionKey`: ví dụ `edit_data`, `view_recommendation`, `canView`: boolean, `canEdit`: boolean).

### B. Phân hệ Đại học (University)

- `university`: Danh sách trường Đại học (mã trường, tên tiếng Việt/Anh, logo, ranking, học phí...).
- `campus`: Cơ sở đào tạo của trường.
- `major`: Danh mục ngành học chung.
- `program`: Chuyên ngành cụ thể của từng trường (liên kết giữa `university`, `campus` và `major`).
- `admission_method`: Phương thức xét tuyển (ví dụ: Xét điểm thi THPT, Xét học bạ, Xét điểm ĐGNL).
- `admission_score`: Điểm chuẩn qua các năm của từng chuyên ngành theo từng phương thức xét tuyển.
- `admission_rule`: Công thức và điều kiện tính điểm của từng phương thức (sử dụng biểu thức toán học).
- `evaluation_history`: Lịch sử đánh giá và tối ưu hóa nguyện vọng của người dùng.

### C. Phân hệ Lớp 10 (Grade 10 HCM)

- `grade10_districts`: Danh sách quận/huyện tại TP.HCM.
- `grade10_schools`: Danh sách trường THPT công lập tại TP.HCM. Ngoài thông tin cơ bản (tên, mã, quận, địa chỉ, website) còn có: `description` (giới thiệu), `comments` (đánh giá chung), `activities` (hoạt động & phong trào: CLB, ngoại khóa, Olympic, giải thưởng, văn nghệ), `regulations` (nội quy & quy định: đồng phục, điện thoại, tác phong...), tọa độ `latitude`/`longitude` phục vụ tính khoảng cách, `mapUrl`, `isVerified`. Dữ liệu activities/regulations được biên tập từ website trường và báo chí, import qua preset `data/imports/g10hcm_activities_regulations_batch*.json` (import service hỗ trợ các trường text này ở cả nhánh tạo mới và cập nhật).
- `grade10_quotas`: Chỉ tiêu tuyển sinh lớp 10 của các trường THPT qua các năm (chỉ tiêu, số đăng ký NV1, tỷ lệ chọi tự tính).
- `grade10_cutoffs`: Điểm chuẩn 3 nguyện vọng (NV1, NV2, NV3) thường và chuyên qua các năm của các trường THPT.

> **Quy ước TypeORM quan trọng:** mọi cột entity có kiểu TypeScript dạng union (ví dụ `string | null`) **bắt buộc** khai báo `type` tường minh trong `@Column({ type: 'varchar' | 'int' | 'text'... })`. Nếu thiếu, decorator metadata sẽ emit `Object` và TypeORM ném `DataTypeNotSupportedError` khi khởi tạo trên Vercel, làm sập toàn bộ API (đã xảy ra 2 lần với `address` và `registeredCount`).

### D. Tính năng chính phân hệ Lớp 10 (cập nhật 07/2026)

- **Tra cứu trường**: tìm theo tên (debounce 350ms), lọc đa quận/huyện, lọc "Tìm gần nhà" theo quãng đường đi thực tế; trang chi tiết trường hiển thị liên tục (tổng quan → điểm chuẩn → chỉ tiêu & chọi) kèm bản đồ Google Maps nhúng và nút **In PDF hồ sơ trường**; so sánh tối đa 3 trường với nút **In PDF bảng so sánh**.
- **Đánh giá NV**: nhập điểm thi thử → chấm xác suất đỗ từng trường (điểm chuẩn dự đoán có điều chỉnh dịch chuyển năm).
- **Tư vấn NV (combo 3 nguyện vọng)**: 3 phương án An Toàn / Nỗ Lực / Phòng Thủ (desktop dạng tab, mobile hiển thị nối tiếp); chọn phạm vi theo **khoảng cách từ nhà** (bắt buộc vị trí đã xác nhận nằm trong ranh giới TP.HCM) hoặc theo **quận/huyện mong muốn** (bắt buộc chọn ít nhất 1 quận); trường mơ ước chọn qua dropdown 2 cấp nhóm theo quận kèm điểm chuẩn NV1.
- **Vị trí nhà**: một modal thống nhất gồm 3 cách — nhập địa chỉ (chuẩn hóa + xác nhận), GPS thiết bị, hoặc ghim trên bản đồ Leaflet; backend geocode qua Google (fallback Nominatim) + reverse-geocode.
- **In PDF**: khu vực in dùng React portal gắn thẳng vào `<body>`; hỗ trợ 3 loại tài liệu — kết quả phân tích (đánh giá + 3 phương án), hồ sơ trường, bảng so sánh trường.
- **Footer** hiển thị phiên bản, mã commit và thời điểm build (inject qua Vite `define`) để nhận biết bản deploy.

## 4. Deployment (Quy trình triển khai trên Vercel)

Cả frontend và backend đều được deploy trực tiếp lên Vercel thông qua Github integration.

### Frontend Deployment

- **Root Directory**: `apps/frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` (chạy lệnh `tsc -b && vite build` tạo ra thư mục `dist`).
- **Output Directory**: `dist`
- **Routing Fallback**: File `vercel.json` ở frontend cấu hình rewrite toàn bộ request về `index.html` để phục vụ Client-Side Routing (React Router/State):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Backend Deployment (Serverless Function)

- **Root Directory**: `apps/backend`
- **Framework Preset**: `NestJS` (hoặc `Other` nếu tự cấu hình Serverless).
- **Entrypoint**: File `api/index.ts` đóng vai trò là serverless function handler.
- **Cơ chế khởi chạy Serverless**: Do serverless functions của Vercel chạy độc lập và giải phóng bộ nhớ khi rảnh (Cold Start), việc gọi NestJS bootstrap đồng bộ lúc load module có thể gây crash. Hệ thống đã được tối ưu hóa sang cơ chế Lazy-loading & Awaiting initialization trước khi xử lý request:

```typescript
// api/index.ts
const server = express();
let isInitialized = false;

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  // ... Cấu hình Cors, Validation, Swagger ...
  await app.init();
  isInitialized = true;
};

export default async (req: any, res: any) => {
  if (!isInitialized) {
    await bootstrap();
  }
  return server(req, res);
};
```

- **Routing**: File `vercel.json` ở backend định tuyến toàn bộ API request về serverless handler `api/index.ts`:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.ts" }
  ]
}
```
