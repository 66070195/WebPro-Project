const sidebar = document.getElementById('sidebar');

// SIDEBAR COLLAPSE
const toggleSidebar = document.querySelector('nav .toggle-sidebar');
const allSideDivider = document.querySelectorAll('#sidebar .divider');

if(sidebar.classList.contains('hide')) {
	allSideDivider.forEach(item=> {
		item.textContent = '-'
	})
} else {
	allSideDivider.forEach(item=> {
		item.textContent = item.dataset.text;
	})
}

toggleSidebar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
	const sidebarClass = sidebar.classList.contains('hide') ? 'hide' : '';

	fetch('/toggle-sidebar', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ sidebarClass: sidebarClass })
	});

	if(sidebar.classList.contains('hide')) {
		allSideDivider.forEach(item=> {
			item.textContent = '-'
		})
	} else {
		allSideDivider.forEach(item=> {
			item.textContent = item.dataset.text;
		})
	}
})

// SIDEBAR HIDE/SHOW CATEGOLY
sidebar.addEventListener('mouseleave', function () {
	if(this.classList.contains('hide')) {
		allSideDivider.forEach(item=> {
			item.textContent = '-'
		})
	}
})



sidebar.addEventListener('mouseenter', function () {
	if(this.classList.contains('hide')) {
		allSideDivider.forEach(item=> {
			item.textContent = item.dataset.text;
		})
	}
})


// PROFILE DROPDOWN
const profile = document.querySelector('nav .profile');
const imgProfile = profile.querySelector('img');
const dropdownProfile = profile.querySelector('.profile-link');

imgProfile.addEventListener('click', function () {
	dropdownProfile.classList.toggle('show');
})

$(document).ready(function() {
	$('#no-more-tables').each(function() {
		var commonSetting = {
			"language": {
				"sProcessing": "กำลังดำเนินการ...",
				"sLengthMenu": "แสดง _MENU_ แถว",
				"sZeroRecords": "ไม่พบข้อมูล",
				"sInfo": "แสดง _START_ ถึง _END_ จาก _TOTAL_ แถว",
				"sInfoEmpty": "แสดง 0 ถึง 0 จาก 0 แถว",
				"sInfoFiltered": "(กรองข้อมูล _MAX_ แถว)",
				"sInfoPostFix": "",
				"sSearch": "ค้นหา:",
				"sUrl": "",
				"oPaginate": {
					"sFirst": "แรกสุด",
					"sPrevious": "<",
					"sNext": ">",
					"sLast": "ท้ายสุด"
				}
			},
			"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "ทั้งหมด"]]
		};
		if ($(this).hasClass('book-room-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[1, "asc"]]
			}));
		} else if ($(this).hasClass('manage-room-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[0, "asc"]]
			}));
		} else if ($(this).hasClass('manage-user-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[2, "asc"]]
			}));
		}
	});
});