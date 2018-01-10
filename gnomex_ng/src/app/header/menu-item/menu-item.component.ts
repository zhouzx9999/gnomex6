import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NavItem} from '../nav-item';

@Component({
    selector: 'app-menu-item',
    templateUrl: './menu-item.component.html'
})
export class MenuItemComponent implements OnInit {
    @Input() items: any[];
    @ViewChild('childMenu') public childMenu;

    constructor(public router: Router) {
    }

    ngOnInit() {
    }
}
