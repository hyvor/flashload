<!DOCTYPE html>
<html>

<a href="?page=1">Link 1</a>
<a href="?page=2">Link 2</a>
<a href="?page=3">Link 3</a>

<?php

$page = $_GET['page'] ?? 1;

if ($page == 1) {
    echo "I am page 1";
} else if ($page == 2) {
    echo "I am page 2";
} else if ($page == 3) {
    echo "I am page 3";
}
?>

<?php include_once 'flashload-script.php' ?>

</html>