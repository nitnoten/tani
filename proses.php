<?php
include 'koneksi.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id_klp  = mysqli_real_escape_string($conn, $_POST['id_klp']);
    $nama_klp  = mysqli_real_escape_string($conn, $_POST['nama_klp']);
    $alamat_klp = mysqli_real_escape_string($conn, $_POST['alamat_klp']);

    // Query INSERT
    $sql = "INSERT INTO klp_tani (id_klp, nama_klp, alamat_klp) VALUES ('$id_klp', '$nama_klp', '$alamat_klp')";

    if (mysqli_query($conn, $sql)) {
        echo "Data berhasil disimpan.";
        echo "<br><a href='index1.html'>Kembali ke form</a>";
    } else {
        echo "Error: " . $sql . "<br>" . mysqli_error($conn);
    }

    mysqli_close($conn);
}
?>
