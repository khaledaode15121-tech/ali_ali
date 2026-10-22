# Design Code To Web

ثم ببناء كود التصميم هذا إلى موقع يعمل بنسبه 100%

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://design-code-to-web.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3ea70819-b3f8-485e-9c6f-56f506f14f0d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## ERD model

The project data model and database structure were aligned to the boutique domain and documented under [docs/ERD.md](docs/ERD.md). The model includes categories, subcategories, products, offers, customers, orders, reservations, and reviews.
"# ali_ali" 

## بيانات دخول المدير

تسجيل دخول لوحة التحكم يعتمد على اسم المستخدم وكلمة المرور فقط. البريد الإلكتروني محفوظ في سجل حساب المدير، ويمكن تغييره من قسم **الحساب والأمان** بعد تسجيل الدخول. كلمات المرور تحفظ كـHash مملح ولا تحفظ بصيغتها الأصلية.

لتعيين بيانات المدير الحالية على قاعدة بيانات موجودة مرة واحدة، اضبط `ADMIN_USERNAME` و`ADMIN_EMAIL` و`ADMIN_PASSWORD` كمتغيرات بيئة خاصة على الخادم، ثم شغّل `npm run admin:credentials`. لا تضع كلمة المرور في Git أو سجل الأوامر. بعد نجاح الأمر احذف `ADMIN_PASSWORD` من بيئة التشغيل؛ الحساب سيظل يعمل اعتماداً على الـHash المخزن.
