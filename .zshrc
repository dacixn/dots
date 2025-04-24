# Lines configured by zsh-newuser-install
unsetopt beep
bindkey -e
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/daci/.zshrc'
autoload -Uz compinit
compinit
# End of lines added by compinstall

NEWLINE=$'\n'

alias dl='dbus-launch' 
alias rec='wf-recorder -a=alsa_output.pci-0000_00_1f.3-platform-skl_hda_dsp_generic.HiFi__Headphones__sink.monitor'
alias fetch='clear && fastfetch --config os'
alias oracle='ssh ubuntu@129.213.50.87 -i ~/Downloads/ssh-key-2025-04-22.key'
alias sforacle='sftp -i ~/Downloads/ssh-key-2025-04-22.key ubuntu@129.213.50.87'

PROMPT="┏━ %B%F{green}%2~%f%b${NEWLINE}┗━ "


precmd() {
    precmd() {
        echo
    }
}

path=(
  $path
  ~/bin
)

path=(
  $path
  ~/.local/share/bin/
)
