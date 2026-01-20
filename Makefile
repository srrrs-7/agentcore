# Initialize firewall (restricts outbound to allowlisted domains)
.PHONY: firewall

firewall:
	sudo bash /workspace/main/.devcontainer/init-firewall.sh

# Git worktree management
.PHONY: wt wt-d wt-l

WORKTREE_PATH = ../wt_1
COMMIT_ISH = origin/main

wt:
	sudo git worktree add $(WORKTREE_PATH) $(COMMIT_ISH)
	sudo chown -R vscode:vscode $(WORKTREE_PATH)
	cd $(WORKTREE_PATH) \
		&&  bun ci \
		&& bun run db:generate \
		&& bun run db:migrate:deploy \
		&& bun run check \
		&& bun run test:run
	cd $(WORKTREE_PATH) \
		&& claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant || true
	make wt-l

wt-d:
	sudo git worktree remove $(WORKTREE_PATH)
	git worktree prune
	make wt-l

wt-l:	
	git worktree list
	git branch