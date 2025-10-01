<?php
include 'koneksi.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_klp    = intval($_POST['id_klp']);
    $nama_klp  = mysqli_real_escape_string($conn, $_POST['nama_klp']);
    $alamat_klp = mysqli_real_escape_string($conn, $_POST['alamat_klp']);

    $sql = "UPDATE klp_tani SET name='$name', email='$alamat_klp' WHERE id=$id";

    if (mysqli_query($conn, $sql)) {
        header("Location: index.php");
        exit;
    } else {
        echo "Gagal update: " . mysqli_error($conn);
    }
}
?>
