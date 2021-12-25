<!DOCTYPE html>
<html>

<a href="/">Link 1</a>
<a href="?1">Link 2</a>
<a href="?2">Link 3</a>

<?php if (isset($_GET['1'])) {echo <<<DOC
    I am page 1. I have some JS. See the console

    <script>console.log("Page 1 script run")</script>
DOC;} ?>

<script data-flashload-skip-replacing>
<?= file_get_contents('../src/flashload.js') ?>
FlashLoad.start({bar: true});
</script>

</html>