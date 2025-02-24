function meterSelectChange(event) {
	const roomId = event.target.value;
  
	if (roomId) {
	  fetch(`/get-latest-meter/${roomId}`)
		.then(response => response.json())
		.then(data => {
		  document.querySelector('.electric-date').textContent = `วันที่บันทึกมิเตอร์ไฟฟ้าล่าสุด : ${data.elec_date}`;
		  document.querySelector('.electric-prev').textContent = `เลขมิเตอร์ก่อนบันทึก : ${data.elec_unit}`;
		  document.querySelector('.water-date').textContent = `วันที่บันทึกมิเตอร์น้ำล่าสุด : ${data.water_date}`;
		  document.querySelector('.water-prev').textContent = `เลขมิเตอร์ก่อนบันทึก : ${data.water_unit}`;
		})
		.catch(error => console.error('Error:', error));
	} else {
	  document.getElementById('electricmeter').value = '';
	  document.getElementById('watermeter').value = '';
	  document.querySelector('.electric-date').textContent = 'วันที่บันทึกมิเตอร์ไฟฟ้าล่าสุด : (วันที่)';
	  document.querySelector('.electric-prev').textContent = 'เลขมิเตอร์ก่อนบันทึก : (เลข)';
	  document.querySelector('.water-date').textContent = 'วันที่บันทึกมิเตอร์น้ำล่าสุด : (วันที่)';
	  document.querySelector('.water-prev').textContent = 'เลขมิเตอร์ก่อนบันทึก : (เลข)';
	}
  }