<?php
include 'koneksi.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_klp  = mysqli_real_escape_string($conn, $_POST['id_klp']);
    $nama_klp  = mysqli_real_escape_string($conn, $_POST['nama_klp']);
    $alamat_klp = mysqli_real_escape_string($conn, $_POST['alamat_klp']);

    $sql = "INSERT INTO klp_tani (id_klp, nama_klp, alamat_klp) VALUES ('$id_klp', '$nama_klp', '$alamat_klp')";
    if (mysqli_query($conn, $sql)) {
        // Redirect dengan pesan sukses
        header("Location: index.php?status=sukses_tambah");
        exit;
    } else {
        // Redirect dengan pesan gagal
        header("Location: index.php?status=gagal_tambah");
        exit;
    }
} else {
    // Jika bukan POST, redirect ke index
    header("Location: index.php");
    exit;
}