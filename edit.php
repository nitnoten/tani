<?php
include 'koneksi.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Tambahkan debug error
$query = "SELECT * FROM klp_tani WHERE id_klp = $id";
$result = mysqli_query($conn, $query) or die("Query error: " . mysqli_error($conn));

$data = mysqli_fetch_assoc($result);

if (!$data) {
    echo "Data tidak ditemukan!";
    exit;
}
?>
