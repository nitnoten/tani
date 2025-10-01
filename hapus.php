<?php
include 'koneksi.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

$sql = "DELETE FROM klp_tani WHERE id_klp = $id";

if (mysqli_query($conn, $sql)) {
    header("Location: index.php?status=sukses_hapus");
    exit;
} else {
    header("Location: index.php?status=gagal_hapus");
    exit;
}
