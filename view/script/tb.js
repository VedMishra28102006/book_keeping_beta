let tb = document.getElementById("tb");
let tb_table = document.getElementById("tb_table");
let fetch_tb = () => {
	let tbody = tb_table.querySelector(".tbody");
	tbody.innerHTML = "";
	fetch(`/tb/${user_token}/${uid}/${fy_id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			let empty_row = "<div aria-label='Empty Row' class='tr' role='row'>"+"<div class='td' role='cell'></div>".repeat(3)+"</div>";
			for (let i=0; i < data.debit_side.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div aria-label="Trial Balance Debit Row: ${i}" class="tr" role="row">
					<div class="td" role="cell">
						<input aria-labelledby="tb_account_head" autocomplete="off" id="tb_debit_account_${i}" name="tb_debit_account_${i}" readonly type="text" value="${data.debit_side[i].account}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="tb_debit_head" autocomplete="off" id="tb_debit_amount_${i}" name="tb_debit_amount_${i}" readonly type="number" value="${data.debit_side[i].balance}">
					</div>
					<div class="td" role="cell"></div>
				</div>`);
			}
			for (let i=0; i < data.credit_side.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div aria-label="Trial Balance Credit Row: ${i}" class="tr" role="row">
					<div class="td" role="cell">
						<input aria-labelledby="tb_account_head" autocomplete="off" id="tb_credit_account_${i}" name="tb_credit_account_${i}" readonly type="text" value="${data.credit_side[i].account}">
					</div>
					<div class="td" role="cell"></div>
					<div class="td" role="cell">
						<input aria-labelledby="tb_credit_head" autocomplete="off" id="tb_credit_amount_${i}" name="tb_credit_amount_${i}" readonly type="number" value="${data.credit_side[i].balance}">
					</div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div aria-label="Trial Balance Row: Total" class="tr" role="row">
				<div class="td" role="cell">
					<span id="tb_total">Total</span>
				</div>
				<div class="td" role="cell">
					<input aria-labelledby="tb_total" autocomplete="off" id="tb_dr_total" name="tb_dr_total" readonly type="number" value="${data.debit_total}">
				</div>
				<div class="td" role="cell">
					<input aria-labelledby="tb_total" autocomplete="off" id="tb_cr_total" name="tb_cr_total" readonly type="number" value="${data.credit_total}">
				</div>
			</div>`);
		}
	})
	.catch(error => {
		alert(error);
	});
};
let export_tb = async () => {
	if (!tb_table.querySelector(".tbody").children.length) {
		return;
	}
	window.location.href = `/tb/${user_token}/${uid}/${fy_id}?download=True`;
};