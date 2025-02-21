document.getElementById('editroom-submit').addEventListener('click', function() {
	if (document.getElementById('editroom-form').checkValidity()) {
        document.getElementById('editroom-form').action = '/editroom-submit';
        document.getElementById('editroom-form').submit();
    } else {
        document.getElementById('editroom-form').reportValidity();
    }
});

document.getElementById('editroom-cancel').addEventListener('click', function() {
	document.getElementById('editroom-form').action = '/editroom-cancel';
	document.getElementById('editroom-form').submit();
});