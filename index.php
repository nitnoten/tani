<?php
include 'koneksi.php';

// Ambil data dari database
$result = mysqli_query($conn, "SELECT * FROM klp_tani ORDER BY id DESC");
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>CRUD PHP + Bootstrap</title>
    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<div class="container mt-5">

<?php if (isset($_GET['status'])): ?>
    <?php
        $status = $_GET['status'];
        $alertType = "success";
        $message = "";

        if ($status == 'sukses_tambah') {
            $message = "Data berhasil ditambahkan.";
        } elseif ($status == 'gagal_tambah') {
            $message = "Gagal menambahkan data.";
            $alertType = "danger";
        } elseif ($status == 'sukses_hapus') {
            $message = "Data berhasil dihapus.";
        } elseif ($status == 'gagal_hapus') {
            $message = "Gagal menghapus data.";
            $alertType = "danger";
        }
    ?>
    <div class="alert alert-<?= $alertType ?> alert-dismissible fade show" role="alert">
        <?= $message ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

    <h2 class="text-center mb-4">Form Tambah User</h2>

    <!-- Form Tambah -->
    <div class="card mb-4">
        <div class="card-body">
            <form action="tambah.php" method="POST">
                <div class="mb-3">
                    <label for="id" class="form-label">ID Kelompok Tani</label>
                    <input type="text" class="form-control" id="id_klp" name="id_klp" placeholder="Masukkan ID Kelompok Tani" required>
                </div>

                <div class="mb-3">
                    <label for="nama" class="form-label">Nama Kelompok Tani</label>
                    <input type="text" class="form-control" id="nama_klp" name="nama_klp" placeholder="Masukkan Nama" required>
                </div>

                <div class="mb-3">
                    <label for="alamat" class="form-label">Alamat Kelompok Tani</label>
                    <input type="text" class="form-control" id="alamat_klp" name="alamat_klp" placeholder="Masukkan Alamat" required>
                </div>

                <button type="submit" class="btn btn-success w-100">Tambah</button>
            </form>
        </div>
    </div>

    <!-- Tabel Data -->
    <h2 class="text-center mb-3">Daftar Pengguna</h2>

    <table class="table table-bordered table-hover">
        <thead class="table-primary text-center">
            <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Alamat</th>
                <th width="150px">Aksi</th>
            </tr>
        </thead>
        <tbody>
            <?php if (mysqli_num_rows($result) > 0): ?>
                <?php while ($row = mysqli_fetch_assoc($result)) : ?>
                <tr>
                    <td class="text-center"><?= $row['id'] ?></td>
                    <td><?= htmlspecialchars($row['nama']) ?></td>
                    <td><?= htmlspecialchars($row['alamat']) ?></td>
                    <td class="text-center">
                        <a href="edit.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-warning">Edit</a>
                        <a href="hapus.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Yakin ingin hapus?')">Hapus</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            <?php else: ?>
                <tr>
                    <td colspan="4" class="text-center text-muted">Belum ada data</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- Bootstrap JS (optional, untuk interaktif) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>
