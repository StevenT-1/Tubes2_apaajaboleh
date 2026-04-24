# Tubes2_apaajaboleh

**IF2211 Strategi Algoritma - Tugas Besar 2**

## Deskripsi Singkat

Aplikasi ini digunakan untuk mencari elemen HTML yang cocok dengan CSS selector.

Pencarian dilakukan dengan algoritma traversal seperti BFS dan DFS. Aplikasi ini memiliki antarmuka web, sehingga pengguna bisa memasukkan URL atau HTML langsung, memilih selector dan algoritma, lalu melihat hasil pencarian secara visual.

## Fitur

- Input URL atau HTML langsung.
- Pencarian elemen dengan CSS selector.
- Algoritma BFS, DFS, dan BFS Parallel.
- Pilihan semua hasil atau Top N.
- Visualisasi pohon DOM.
- Log traversal.
- Animasi traversal.
- LCA Finder.
- Download log traversal.

## Algoritma yang Digunakan

- **BFS:** menelusuri node per level.
- **DFS:** menelusuri sedalam mungkin terlebih dahulu.
- **BFS Parallel:** BFS dengan pemrosesan node pada level yang sama secara konkuren.
- **LCA:** mencari ancestor terdekat dari dua node.

## Dependencies

- Docker dan Docker Compose
- Go, jika menjalankan backend secara manual
- Node.js dan npm, jika menjalankan frontend secara manual

Teknologi yang digunakan:

- Backend: Go
- Frontend: React + TypeScript + Vite
- Visualisasi: React Flow / `@xyflow/react`
- Container dan server frontend: Docker, Docker Compose, nginx

## Cara Setup

```bash
git clone https://github.com/StevenT-1/Tubes2_apaajaboleh.git
cd Tubes2_apaajaboleh
```

## Cara Compile / Build

Build dengan Docker Compose:

```bash
docker compose build
```

Jika ingin build sekaligus langsung menjalankan aplikasi:

```bash
docker compose up -d --build
```

Build backend secara manual dari root repository:

```bash
go mod download
go build -o server ./backend/cmd/server
```

`go mod download` mengunduh dependency Go.

`go build` meng-compile backend menjadi file executable bernama `server`.

Build frontend secara manual:

```bash
cd frontend
npm ci
npm run build
```

`npm ci` meng-install dependency frontend sesuai `package-lock.json`.

`npm run build` membuat hasil build frontend di folder `dist`.

## Cara Menjalankan

### Melalui Web

Aplikasi juga dapat diakses melalui URL berikut:

```text
http://tubes2-apaajaboleh.centralindia.cloudapp.azure.com/
```

### Dengan Docker Compose

Build dan jalankan aplikasi:

```bash
docker compose up -d --build
```

Cek apakah container sudah berjalan:

```bash
docker compose ps
```

Buka aplikasi di browser:

```text
http://localhost
```

Hentikan aplikasi:

```bash
docker compose down
```

`docker compose up -d --build` membangun image jika perlu lalu menjalankan backend dan frontend di background.

`docker compose ps` dipakai untuk mengecek apakah container sedang berjalan.

`docker compose down` dipakai untuk menghentikan aplikasi.

### Manual

Cara ini opsional jika ingin menjalankan backend dan frontend tanpa Docker.

Jalankan backend dari root repository:

```bash
go run ./backend/cmd/server
```

Atau, jika backend sudah di-build sebelumnya:

```bash
./server
```

Jalankan frontend di terminal lain:

```bash
cd frontend
npm ci
npm run dev
```

`npm run dev` menjalankan Vite development server.

Frontend dibuka dari URL yang muncul di terminal. Biasanya Vite memakai port default seperti:

```text
http://localhost:5173
```

Port tersebut bukan port tetap proyek dan bisa berubah jika port itu sudah dipakai.

## Cara Menggunakan Aplikasi

1. Buka aplikasi di browser.
2. Pilih input URL atau HTML langsung.
3. Masukkan CSS selector.
4. Pilih algoritma: BFS, DFS, atau BFS Parallel.
5. Pilih mode hasil: semua hasil atau Top N.
6. Klik **Mulai Penelusuran**.
7. Lihat hasil, log traversal, visualisasi DOM, dan animasi traversal.
8. Untuk LCA, pilih dua node pada visualisasi, lalu klik **Find LCA**.

## Catatan Singkat

- Halaman yang sangat bergantung pada JavaScript mungkin tidak terbaca lengkap jika HTML awal tidak memuat kontennya.
- Selector yang didukung adalah subset CSS selector yang diimplementasikan.
- Deployment default menggunakan HTTP, bukan HTTPS.

## Penulis

Kelompok **apaajaboleh**

Anggota:

- Steven Tan - 13524060
- Nathanael Gunawan - 13524066
- Helena Kristela Sarhawa - 13524109
