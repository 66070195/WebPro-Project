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


function addMore() {
	let table = document.getElementById("extra");
	let newRow = document.createElement("tr");
	newRow.innerHTML = `
		<td><input type="text" class="form-control" placeholder="รายการ"></td>
		<td><input type="number" class="form-control" placeholder="ราคา"></td>
		<td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">X</button></td>
	`;
	table.appendChild(newRow);
}

function removeRow(button) {
	button.closest("tr").remove();
}


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
                "order": [[0, "asc"]]
			}));
		} else if ($(this).hasClass('request-fix-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "desc"]],
				"lengthMenu": [[5, 10, 20, -1], [5, 10, 20, "ทั้งหมด"]]
			}));
		} else if ($(this).hasClass('invoice-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "asc"]]
			}));
		} else if ($(this).hasClass('showinvoice-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "asc"]]
			}));
		} else if ($(this).hasClass('showreceipt-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "asc"]]
			}));
		} else if ($(this).hasClass('parcel-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "desc"]],
				"lengthMenu": [[5, 10, 20, -1], [5, 10, 20, "ทั้งหมด"]]
			}));
		} else if ($(this).hasClass('wait-parcel-table')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[3, "desc"]],
				"lengthMenu": [[5, 10, 20, -1], [5, 10, 20, "ทั้งหมด"]]
			}));
		}
	});
});

// function confirmDelete() {
//     return confirm('ยืนยันการลบ?');
// }


function confirmDelete(formId) {
    let confirmBox = document.createElement('div');
    confirmBox.style.position = 'fixed';
    confirmBox.style.top = '50%';
    confirmBox.style.left = '50%';
    confirmBox.style.transform = 'translate(-50%, -50%)';
    confirmBox.style.background = 'var(--grey)';
    confirmBox.style.padding = '20px';
    confirmBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    confirmBox.style.border = '1px solid grey';
    confirmBox.innerHTML = `
        <p>ยืนยันที่จะลบ?</p>
        <button class="btn btn-warning text-light" onclick="document.body.removeChild(this.parentNode); document.getElementById('${formId}').submit();">ยืนยัน</button>
        <button class="btn btn-danger" onclick="document.body.removeChild(this.parentNode);">ยกเลิก</button>
    `;
    document.body.appendChild(confirmBox);
    return false;
}

function showDetails(itemId) {
    fetch('/getuserdetails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: itemId })
    })
    .then(response => response.json())
    .then(data => {
        let detailsBox = document.createElement('div');
        detailsBox.id = 'detailsBox';
        detailsBox.style.position = 'fixed';
        detailsBox.style.top = '50%';
        detailsBox.style.left = '50%';
        detailsBox.style.transform = 'translate(-50%, -50%)';
        detailsBox.innerHTML = `
            <div class="card border-secondary mb-3 shadowing">
                <div class="card-header fs-2">รายละเอียดผู้ใช้ : ${data.id}</div>
                <div class="card-body">
                    <p><span class="fw-bold">ชื่อเต็ม:</span> ${data.fname} ${data.lname}</p>
                    <p><span class="fw-bold">เลขบัตรประชาชน:</span> ${data.id_card}</p>
					<hr>
                    <p><span class="fw-bold">เบอร์โทรศัพท์:</span> ${data.phone}</p>
                    <p><span class="fw-bold">รหัสผ่าน:</span> ${data.password}</p>
					<hr>
                    <p><span class="fw-bold">ห้องพัก:</span> ${data.room_id == null ? 'ไม่มีห้องพัก' : data.room_id}</p>
                    <hr>
					<button class="btn form-control btn-danger" onclick="document.body.removeChild(document.getElementById('detailsBox'));">ปิด</button>
                </div>
            </div>
        `;
        document.body.appendChild(detailsBox);
    })
    .catch(error => console.error('Error:', error));
}


function repairSelectChange(event) {
	const selectedId = event.target.value;
	const detailField = document.getElementById('description');
	const costField = document.getElementById('cost');

	if (selectedId) {
		// ถ้ามี value ใน option ที่เลือก
		fetch(`/api/item/${selectedId}`)
			.then(response => response.json())
			.then(data => {
				detailField.value = data.detail;
				costField.value = data.cost;
				document.getElementById(`inlineRadio${data.status}`).checked = true;
			})
			.catch(error => console.error('Error:', error));
	} else {
		detailField.value = '';
		costField.value = '0';
		document.querySelectorAll('input[name="fixStatus"]').forEach(radio => radio.checked = false);
	}
	// fetch(`/api/item/${selectedId}`)
	// 	.then(response => response.json())
	// 	.then(data => {
	// 		inputField.value = data.detail;
	// 	})
	// 	.catch(error => console.error('Error:', error));
}
