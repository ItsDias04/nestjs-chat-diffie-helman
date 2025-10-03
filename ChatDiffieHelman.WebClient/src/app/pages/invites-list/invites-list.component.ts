import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Invite } from '../../data/Entities/Invite';
import {
  InviteRespondDto,
  InviteService,
} from '../../data/services/invite.service';

@Component({
  selector: 'app-invites-list',
  imports: [RouterLink, CommonModule],
  templateUrl: './invites-list.component.html',
  styleUrl: './invites-list.component.css',
})
export class InvitesListComponent {
  invites: Invite[] | undefined;

  constructor(private inviteService: InviteService) {}

  ngOnInit() {
    this.inviteService.getMyInvites().subscribe((invites) => {
      this.invites = invites;
    });
  }
  acceptInvite(inviteId: string) {
    this.inviteService
      .respondToInvite({ inviteId, accept: true })
      .subscribe((updatedInvite) => {
        if (this.invites) {
          const index = this.invites.findIndex(
            (inv) => inv.id === updatedInvite.id
          );
          if (index !== -1) {
            this.invites[index] = updatedInvite;
          }
        }
      });
  }

  declineInvite(inviteId: string) {
    this.inviteService
      .respondToInvite({
        inviteId: inviteId,
        accept: false,
      } as InviteRespondDto)
      .subscribe((updatedInvite) => {
        if (this.invites) {
          const index = this.invites.findIndex(
            (inv) => inv.id === updatedInvite.id
          );
          if (index !== -1) {
            this.invites[index] = updatedInvite;
          }
        }
      });
  }
}
