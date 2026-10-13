let bs = document.getElementById("bs");
let bs_table = document.getElementById("bs_table");
let fetch_bs = () => {
	bs_table.querySelector(".tbody").innerHTML = "";
	fetch(`/bs/${user_token}/${uid}/${fy_id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			let tbody = bs_table.querySelector(".tbody");
			tbody.insertAdjacentHTML("beforeend", `<div aria-label="Balance Sheet Row: Subheaders" class="tr" role="row">
				<div class="td" id="bs_current_assets_subhead" role="cell" style="grid-column: span 2"><span>Current Assets:</span></div>
				<div class="td" id="bs_current_liabilities_subhead" role="cell" style="grid-column: span 2"><span>Current Liabilities:</span></div>
			</div>`);
			let empty_row = "<div class='tr' role='row'>"+"<div class='td' role='cell'></div>".repeat(4)+"</div>";
			for (let i=0; i < Math.max(data.assets.current.length, data.liabilities.current.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr" role="row">
					<div class="td" role="cell">
						<input aria-labelledby="bs_assets_head bs_current_assets_subhead" autocomplete="off" id="bs_current_assets_${i}" name="bs_current_assets_${i}" readonly type="text" value="${data.assets.current[i] ? data.assets.current[i].bs_account : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_assets_amount_head bs_current_assets_subhead" autocomplete="off" id="bs_current_assets_amount_${i}" name="bs_current_assets_amount_${i}" readonly type="text" value="${data.assets.current[i] ? ((data.assets.current[i].bs_operation == "add") ? data.assets.current[i].bs_amount : `(${data.assets.current[i].bs_amount})`) : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_head bs_current_liabilities_subhead" autocomplete="off" id="bs_current_liabilities_${i}" name="bs_current_liabilities_${i}" readonly type="text" value="${data.liabilities.current[i] ? data.liabilities.current[i].bs_account : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_amount_head bs_current_liabilities_subhead" autocomplete="off" id="bs_current_liabilities_amount_${i}" name="bs_current_liabilities_amount_${i}" readonly type="text" value="${data.liabilities.current[i] ? ((data.liabilities.current[i].bs_operation == "add") ? data.liabilities.current[i].bs_amount : `(${data.liabilities.current[i].bs_amount})`) : ""}">
					</div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr" role="row">
				<div class="td" role="cell" id="total_bs_current_assets"><span>Total current assets</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_current_assets" autocomplete="off" id="total_bs_current_assets_amount" name="total_bs_current_assets_amount" readonly type="text" value="${(data.assets.current_total >= 0) ? data.assets.current_total : `(${Math.abs(data.assets.current_total)})`}">
				</div>
				<div class="td" role="cell" id="total_bs_current_liabilities"><span>Total current liabilities</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_current_liabilities" autocomplete="off" id="total_bs_current_liabilities_amount" name="total_bs_current_liabilities_amount" readonly type="text" value="${(data.liabilities.current_total >= 0) ? data.liabilities.current_total : `(${Math.abs(data.liabilities.current_total)})`}">
				</div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div aria-label="Balance Sheet Row: Subheaders" class="tr" role="row">
				<div class="td" id="bs_noncurrent_assets_subhead" role="cell" style="grid-column: span 2"><span>Non-Current Assets:</span></div>
				<div class="td" id="bs_noncurrent_liabilities_subhead" role="cell" style="grid-column: span 2"><span>Non-Current Liabilities:</span></div>
			</div>`);
			for (let i=0; i < Math.max(data.assets.noncurrent.length, data.liabilities.noncurrent.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr" role="row">
					<div class="td" role="cell">
						<input aria-labelledby="bs_assets_head bs_noncurrent_assets_subhead" autocomplete="off" id="bs_noncurrent_assets_${i}" name="bs_noncurrent_assets_${i}" readonly type="text" value="${data.assets.noncurrent[i] ? data.assets.noncurrent[i].bs_account : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_assets_amount_head bs_noncurrent_assets_subhead" autocomplete="off" id="bs_noncurrent_assets_amount_${i}" name="bs_noncurrent_assets_amount_${i}" readonly type="text" value="${data.assets.noncurrent[i] ? ((data.assets.noncurrent[i].bs_operation == "add") ? data.assets.noncurrent[i].bs_amount : `(${data.assets.noncurrent[i].bs_amount})`) : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_head bs_noncurrent_liabilities_subhead" autocomplete="off" id="bs_noncurrent_liabilities_${i}" name="bs_noncurrent_liabilities_${i}" readonly type="text" value="${data.liabilities.noncurrent[i] ? data.liabilities.noncurrent[i].bs_account : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_amount_head bs_noncurrent_liabilities_subhead" autocomplete="off" id="bs_noncurrent_liabilities_amount_${i}" name="bs_noncurrent_liabilities_amount_${i}" readonly type="text" value="${data.liabilities.noncurrent[i] ? ((data.liabilities.noncurrent[i].bs_operation == "add") ? data.liabilities.noncurrent[i].bs_amount : `(${data.liabilities.noncurrent[i].bs_amount})`) : ""}">
					</div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr" role="row">
				<div class="td" role="cell" id="total_bs_noncurrent_assets"><span>Total non-current assets</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_noncurrent_assets" autocomplete="off" id="total_bs_noncurrent_assets_amount" name="total_bs_noncurrent_assets_amount" readonly type="text" value="${(data.assets.noncurrent_total >= 0) ? data.assets.noncurrent_total : `(${Math.abs(data.assets.noncurrent_total)})`}">
				</div>
				<div class="td" role="cell" id="total_bs_noncurrent_liabilities"><span>Total non-current liabilities</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_noncurrent_liabilities" autocomplete="off" id="total_bs_noncurrent_liabilities_amount" name="total_bs_noncurrent_liabilities_amount" readonly type="text" value="${(data.liabilities.noncurrent_total >= 0) ? data.liabilities.noncurrent_total : `(${Math.abs(data.liabilities.noncurrent_total)})`}">
				</div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div aria-label="Balance Sheet Row: Subheaders" class="tr" role="row">
				<div class="td" role="cell" style="grid-column: span 2"></div>
				<div class="td" id="bs_shareholders_equity_subhead" role="cell" style="grid-column: span 2"><span>Shareholders' Equity:</span></div>
			</div>`);
			for (let i=0; i < data.liabilities.equity.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr">
					<div class="td" style="grid-column: span 2"></div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_head bs_shareholders_equity_subhead" autocomplete="off" id="bs_shareholders_equity_${i}" name="bs_shareholders_equity_${i}" readonly type="text" value="${data.liabilities.equity[i] ? data.liabilities.equity[i].bs_account : ""}">
					</div>
					<div class="td" role="cell">
						<input aria-labelledby="bs_liabilities_amount_head bs_shareholders_equity_subhead" autocomplete="off" id="bs_shareholders_equity_amount_${i}" name="bs_shareholders_equity_amount_${i}" readonly type="text" value="${data.liabilities.equity[i] ? ((data.liabilities.equity[i].bs_operation == "add") ? data.liabilities.equity[i].bs_amount : `(${data.liabilities.equity[i].bs_amount})`) : ""}">
					</div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr">
				<div class="td" role="cell" style="grid-column: span 2"></div>
				<div class="td" role="cell" id="total_bs_shareholders_equity"><span>Total shareholders' equity</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_shareholders_equity" autocomplete="off" id="total_bs_shareholders_equity_amount" name="total_bs_shareholders_equity_amount" readonly type="text" value="${(data.liabilities.equity_total >= 0) ? data.liabilities.equity_total : `(${Math.abs(data.liabilities.equity_total)})` }">
				</div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div class="tr" role="row">
				<div class="td" class="cell" id="total_bs_assets"><span>Total assets</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_assets" autocomplete="off" id="total_bs_assets_amount" name="total_bs_assets_amount" readonly type="text" value="${(data.assets.total >= 0) ? data.assets.total : `(${Math.abs(data.assets.total)})` }">
				</div>
				<div class="td" class="cell" id="total_bs_liabilities"><span>Total liabilities</span></div>
				<div class="td" role="cell">
					<input aria-labelledby="total_bs_liabilities" autocomplete="off" id="total_bs_liabilities_amount" name="total_bs_liabilities_amount" readonly type="text" value="${(data.liabilities.total >= 0) ? data.liabilities.total : `(${Math.abs(data.liabilities.total)})`}">
				</div>
			</div>`);
		}
	})
	.catch(error => {
		alert(error);
	});
};
let export_bs = async () => {
	if (!bs_table.querySelector(".tbody").children.length) {
		return;
	}
	window.location.href = `/bs/${user_token}/${uid}/${fy_id}?download=True`;
};