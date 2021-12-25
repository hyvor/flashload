<!DOCTYPE html>
<html>

<a href="/">Link 1</a>
<a href="?1">Link 2</a>
<a href="?2">Link 3</a>

<?php if (isset($_GET['1'])) {echo "I am link 2";} ?>

<script>
<?= file_get_contents('../src/flashload.js') ?>
FlashLoad();
</script>

</html>