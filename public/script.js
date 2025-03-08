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
                "order": [[0, "desc"]]
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
		else if ($(this).hasClass('invoice-tables')) {
			$(this).DataTable($.extend({}, commonSetting, {
                "order": [[0, "desc"]]
			}));
		}
	});
});

// function confirmDelete() {
//     return confirm('ยืนยันการลบ?');
// }


function confirmDelete(formId) {
    // สร้าง backdrop
    let backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '1040';
    
    // สร้างกล่องยืนยัน
    let confirmBox = document.createElement('div');
    confirmBox.style.position = 'fixed';
    confirmBox.style.top = '50%';
    confirmBox.style.left = '50%';
    confirmBox.style.transform = 'translate(-50%, -50%)';
    confirmBox.style.backgroundColor = 'white';
    confirmBox.style.borderRadius = '4px';
    confirmBox.style.border = '1px solid #dee2e6';
    confirmBox.style.width = '300px';
    confirmBox.style.zIndex = '1050';
    
    // ใส่เนื้อหาในกล่องยืนยัน
    confirmBox.innerHTML = `
        <div class="card border-0">
            <div class="card-header bg-danger text-white py-2">
                <h5 class="mb-0">ยืนยันการลบ</h5>
            </div>
            <div class="card-body p-3 text-center">
                <p class="mb-0">คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?</p>
            </div>
            <div class="card-footer d-flex gap-2 p-2">
                <button id="cancel-btn" class="btn btn-secondary flex-grow-1">ยกเลิก</button>
                <button id="confirm-btn" class="btn btn-danger flex-grow-1">ยืนยัน</button>
            </div>
        </div>
    `;
    
    // เพิ่ม elements
    document.body.appendChild(backdrop);
    document.body.appendChild(confirmBox);
    
    // ฟังก์ชันปิดกล่องยืนยัน
    function closeConfirm() {
        document.body.removeChild(backdrop);
        document.body.removeChild(confirmBox);
    }
    

    confirmBox.querySelector('#confirm-btn').addEventListener('click', function() {
        closeConfirm();
        document.getElementById(formId).submit();
    });
    
    confirmBox.querySelector('#cancel-btn').addEventListener('click', function() {
        closeConfirm();
    });
    
    // ปิดเมื่อคลิกที่ backdrop
    backdrop.addEventListener('click', function() {
        closeConfirm();
    });
    
    // เพิ่ม Event Listener สำหรับการกด Escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeConfirm();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    return false;
}

function showDetails(itemId) {
    // สร้าง Modal container
    let detailsBox = document.createElement('div');
    detailsBox.id = 'detailsBox';
    detailsBox.style.position = 'fixed';
    detailsBox.style.top = '50%';
    detailsBox.style.left = '50%';
    detailsBox.style.transform = 'translate(-50%, -50%)';
    detailsBox.style.zIndex = '1050';
    detailsBox.style.width = '90%';
    detailsBox.style.maxWidth = '320px';
    
    // สร้าง Backdrop
    let backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '1040';
    
    // เพิ่ม elements เข้าใน DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(detailsBox);
    
    // ฟังก์ชัน close Modal
    function closeModal() {
        document.body.removeChild(backdrop);
        document.body.removeChild(detailsBox);
    }
    
    // เพิ่ม Event Listener สำหรับการกด Escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape' && document.getElementById('detailsBox')) {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    // เพิ่ม Event Listener สำหรับการคลิก backdrop
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
            closeModal();
        }
    });
    
    // ดึงข้อมูลจาก API
    fetch('/getuserdetails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: itemId })
    })
    .then(response => response.json())
    .then(data => {
        // จัดการข้อมูลห้องพัก
        let roomText = data.room_ids && data.room_ids.trim() ? data.room_ids : 'ไม่มีห้องพัก';
        
        // กำหนดสีฟ้าเป็นสีหลัก
        const headerColor = '#3066BE';
        
        // สร้าง HTML สำหรับแสดงรายละเอียด
        detailsBox.innerHTML = `
            <div class="card border-secondary" style="border-radius: 4px;">
                <div class="card-header py-3" style="background-color: ${headerColor}; color: white;">
                    <h5 class="mb-0 fs-5">รายละเอียดผู้ใช้ : ${data.id}</h5>
                </div>
                <div class="card-body p-0">
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <span class="me-2">ชื่อเต็ม:</span>
                        <span>${data.fname} ${data.lname}</span>
                    </div>
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <span class="me-2">เลขบัตรประชาชน:</span>
                        <span>${data.id_card || '-'}</span>
                    </div>
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <span class="me-2">เบอร์โทรศัพท์:</span>
                        <span>${data.phone || '-'}</span>
                    </div>
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <span class="me-2">รหัสผ่าน:</span>
                        <span>${data.password || '-'}</span>
                    </div>
                    <div class="p-3 d-flex justify-content-between align-items-center">
                        <span class="me-2">ห้องพัก:</span>
                        <span>${roomText}</span>
                    </div>
                </div>
                <div class="card-footer p-3 d-flex gap-3">
                    <a href="/edituser?id=${data.id}" class="btn btn-warning flex-grow-1">
                        แก้ไข
                    </a>
                    <button type="button" id="closeBtn" class="btn btn-danger flex-grow-1">
                        ปิด
                    </button>
                </div>
            </div>
        `;
        
        // เพิ่ม Event Listener สำหรับปุ่มปิด
        document.getElementById('closeBtn').addEventListener('click', closeModal);
    })
    .catch(error => {
        detailsBox.innerHTML = `
            <div class="card border-danger">
                <div class="card-header bg-danger text-white py-3">
                    <h5 class="mb-0">เกิดข้อผิดพลาด</h5>
                </div>
                <div class="card-body p-4 text-center">
                    <p class="mb-0">ไม่สามารถดึงข้อมูลได้ กรุณาลองอีกครั้ง</p>
                </div>
                <div class="card-footer p-3">
                    <button type="button" id="closeBtn" class="btn btn-danger w-100">
                        ปิด
                    </button>
                </div>
            </div>
        `;
        
        // เพิ่ม Event Listener สำหรับปุ่มปิด
        document.getElementById('closeBtn').addEventListener('click', closeModal);
        
        console.error('Error:', error);
    });
}


// function showDetails(itemId) {
//     fetch('/getuserdetails', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ id: itemId })
//     })
//     .then(response => response.json())
//     .then(data => {
//         let detailsBox = document.createElement('div');
//         detailsBox.id = 'detailsBox';
//         detailsBox.style.position = 'fixed';
//         detailsBox.style.top = '50%';
//         detailsBox.style.left = '50%';
//         detailsBox.style.transform = 'translate(-50%, -50%)';
//         detailsBox.innerHTML = `
//             <div class="card border-secondary mb-3 shadowing">
//                 <div class="card-header fs-2">รายละเอียดผู้ใช้ : ${data.id}</div>
//                 <div class="card-body">
//                     <p><span class="fw-bold">ชื่อเต็ม:</span> ${data.fname} ${data.lname}</p>
//                     <p><span class="fw-bold">เลขบัตรประชาชน:</span> ${data.id_card}</p>
// 					<hr>
//                     <p><span class="fw-bold">เบอร์โทรศัพท์:</span> ${data.phone}</p>
//                     <p><span class="fw-bold">รหัสผ่าน:</span> ${data.password}</p>
// 					<hr>
//                     <p><span class="fw-bold">ห้องพัก:</span>
// 						${Array.isArray(data.room_id) ? 
// 						data.room_id.map(room => `<p>${room}</p>`).join('') : 
// 						`<p>${data.room_id == null ? 'ไม่มีห้องพัก' : data.room_id}</p>`}
// 					</p>
//                     <hr>
// 					<button class="btn form-control btn-danger" onclick="document.body.removeChild(document.getElementById('detailsBox'));">ปิด</button>
//                 </div>
//             </div>
//         `;
//         document.body.appendChild(detailsBox);
//     })
//     .catch(error => console.error('Error:', error));
// }


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
