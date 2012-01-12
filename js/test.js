/* Basic space-partitioned grid, not as elegant as quad tree - incomplete */
	
	function Grid(cellSize, item, pos, rad, ref) {
		this.cellSize = (cellSize || 5);
		
		this.rows = 0;
		this.number = 0;
		
		if(item) { this.add(item, pos, rad, ref); }
	}
	$.extend(Grid.prototype, {
		add: function(item, pos, rad, ref) {
			if($.isArray(item)) {
				for(var i = 0; i < item.length; ++i) {
					var set = item[i];
					this.add(set.item, set.pos, set.rad, set.ref);
				}
			}
			else {
				var cell = this.cell(pos),
					row = this[cell.row];
				
				if(!$.isArray(row)) {
					row = this[cell.row] = new Array();
					row.columns = 0;
					this.rows = Math.max(this.rows, cell.row+1);
				}
				
				var col = row[cell.col];
				if(!$.isArray(col)) {
					col = row[cell.col] = new Array();
					row.columns = Math.max(row.columns, cell.col+1);
				}
				
				col.push(item);
				
				if(!ref) { ++this.number; }
				
				if(rad) {
					/* TODO: plot a circle, and add copies to the crossed cells,
						with ref true */
				}
			}
			
			return this;
		},
		remove: function(item, pos, rad, ref) {
			if($.isArray(item)) {
				for(var i = 0; i < item.length; ++i) {
					var set = item[i];
					this.remove(set.item, set.pos, set.rad, set.ref);
				}
			}
			else {
				var cell = this.cell(pos),
					row = this[cell.row];
				
				if($.isArray(row)) {
					var col = row[cell.col];
					if($.isArray(col)) {
						col.splice(col.indexOf(item), 1);
						
						if(!ref) { --this.number; }
						
						if(rad) {
							/* TODO: plot a circle, and remove copies the
								crossed cells, with ref true */
						}
					}
				}
			}
			
			return this;
		},
		empty: function(cell) {
			if($.isArray(cell)) {
				for(var c = 0; c < cell.length; ++c) { this.empty(cell[c]); }
			}
			else if(cell) {
				var row = this[cell.row];
				if($.isArray(row)) {
					var col = row[cell.col];
					if($.isArray(col)) {
						this.number -= col.length;
						delete row[cell.col];
					}
					
					while(!$.isArray(row[row.columns-1])) { --row.columns; }
					
					if(!row.columns) {
						delete this[cell.row];
						while(!$.isArray(this[this.rows-1])) { --this.rows; }
					}
				}
			}
			else {
				/* Empty everything */
				while(this.rows) { delete this[this.rows--]; }
				this.number = 0;
				
				/* Better memory management? */
				/*while(this.rows) {
					var row = this[this.rows-1];
					if($.isArray(row)) {
						while(row.columns) {
							var col = row[row.columns-1];
							if($.isArray(col)) {
								this.number -= col.length;
								delete row[row.columns-1];
							}
							--row.columns;
						}
						delete this[this.rows-1];
					}
					--this.rows;
				}*/
			}
			
			return this;
		},
		items: function(cell) {
			if($.isArray(cell)) {
				var items = new Array();
				for(var c = 0; c < cell.length; ++c) {
					items.concat(this.items(cell[c]));
				}
				return items;
			}
			else if(cell) {
				var row = this[cell.row];
				if($.isArray(row)) {
					return row[cell.col].slice(0);
				}
			}
			else {
				/* Return everything */
				var items = new Array();
				
				for(var r = 0; r < this.rows; ++r) {
					var row = this[r];
					if($.isArray(row)) {
						for(var c = 0; c < row.columns; ++c) {
							var col = row[c];
							if($.isArray(col)) {
								items.concat(col);
							}
						}
					}
				}
				
				return items;
			}
		},
		cell: function(pos, rad) {
			if(pos.x >= 0 && pos.y >= 0) {
				var posCell = { row: Math.floor(pos.y/this.cellSize),
					col: Math.floor(pos.x/this.cellSize) };
				
				if(!rad) { return posCell; }
				else {
					var posCells = new Array(posCell);
					/* TODO: return array of cells crossed by rad */
					
					return posCells;
				}
			}
			else { $.error("SpacePartitionedGrid Access Error: negative position"); }
		}
	});