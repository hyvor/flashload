<!DOCTYPE html>
<html>

<div style="padding:10px;text-align:center;position:fixed;left:0;top:0;width:100%;background:white">
<a href="?page=1">Page 1</a>
<a href="?page=2">Page 2</a>
<a href="?page=3">Page 3</a>
<a href="?page=1#hash">Page 1 Hash</a>
</div>


<div style="font-size:30px;padding:30px">

<?php

$page = $_GET['page'] ?? 1;

if ($page == 1) {
    include_once 'page1.php';
} else if ($page == 2) {
    echo "I am page 2";
} else if ($page == 3) {
    echo "I am page 3";
}
?>

</div>

<?php include_once 'flashload-script.php' ?>

</html>

