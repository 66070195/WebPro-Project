document.getElementById('adduser-submit').addEventListener('click', function() {
	if (document.getElementById('adduser-form').checkValidity()) {
        document.getElementById('adduser-form').action = '/adduser-submit';
        document.getElementById('adduser-form').submit();
    } else {
        document.getElementById('adduser-form').reportValidity();
    }
});

document.getElementById('adduser-cancel').addEventListener('click', function() {
	document.getElementById('adduser-form').action = '/adduser-cancel';
	document.getElementById('adduser-form').submit();
});